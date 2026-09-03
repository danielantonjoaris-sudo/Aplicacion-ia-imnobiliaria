"""InmoMatic — API FastAPI."""
import logging

from fastapi import FastAPI, APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from starlette.middleware.cors import CORSMiddleware

from db import db, ahora, oid, limpiar
from specialists import ejecutar_especialista
from seed_data import PROMPTS, FRAGMENTOS
from render_landing import render_landing, normalizar_marca

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(name)s - %(levelname)s - %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI()
api = APIRouter(prefix="/api")

PASO_POR_ESPECIALISTA = {"cliente_ideal": 1, "oferta": 2, "anuncios": 3, "landing": 4}
ESPECIALISTA_POR_PASO = {v: k for k, v in PASO_POR_ESPECIALISTA.items()}


# ------------------- Modelos de entrada -------------------
class AgenciaIn(BaseModel):
    nombre_agencia: str
    zona: str
    tamano_equipo: str
    # La landing se dibuja con la marca de la agencia, no con la de InmoMatic.
    # {"colores": {...}, "tipografia": {...}, "estilo": "...", "logo": "..."}
    marca: dict | None = None


class MarcaIn(BaseModel):
    marca: dict


class CampanaIn(BaseModel):
    tipo: str


class EspecialistaIn(BaseModel):
    respuestas: dict


class UsarGuardadoIn(BaseModel):
    resultado_id: str


class ConocimientoIn(BaseModel):
    fuente: str
    tipo: str
    titulo: str
    contenido: str
    temas: list
    tipo_campana: str


class PromptIn(BaseModel):
    contenido: str


# ------------------- Agencias -------------------
@api.get("/agencias")
async def listar_agencias():
    docs = await db.agencias.find().sort("creado_en", -1).to_list(100)
    return [limpiar(d) for d in docs]


@api.post("/agencias")
async def crear_agencia(datos: AgenciaIn):
    doc = datos.model_dump()
    doc["marca"] = normalizar_marca(doc.get("marca"))
    doc["creado_en"] = ahora()
    res = await db.agencias.insert_one(doc)
    return limpiar(await db.agencias.find_one({"_id": res.inserted_id}))


@api.put("/agencias/{agencia_id}/marca")
async def guardar_marca(agencia_id: str, datos: MarcaIn):
    """Guarda la marca de la agencia ya normalizada: hex válidos y contraste mínimo."""
    marca = normalizar_marca(datos.marca)
    resultado = await db.agencias.update_one({"_id": oid(agencia_id)}, {"$set": {"marca": marca}})
    if resultado.matched_count == 0:
        raise HTTPException(404, "Agencia no encontrada")
    return {"marca": marca}


# ------------------- Campañas -------------------
@api.get("/campanas")
async def listar_campanas():
    docs = await db.campanas.find().sort("creado_en", -1).to_list(200)
    return [limpiar(d) for d in docs]


@api.get("/campanas/{campana_id}")
async def obtener_campana(campana_id: str):
    doc = await db.campanas.find_one({"_id": oid(campana_id)})
    if not doc:
        raise HTTPException(404, "Campaña no encontrada")
    return limpiar(doc)


@api.post("/campanas")
async def crear_campana(datos: CampanaIn):
    agencia = await db.agencias.find_one(sort=[("creado_en", -1)])
    zona = agencia.get("zona") if agencia else None
    nombre = f"Captación en {zona}" if zona else "Campaña de captación"
    doc = {
        "agencia_id": agencia["_id"] if agencia else None,
        "tipo": datos.tipo,
        "nombre": nombre,
        "estado": "en_proceso",
        "paso_actual": 1,
        "creado_en": ahora(),
    }
    res = await db.campanas.insert_one(doc)
    return limpiar(await db.campanas.find_one({"_id": res.inserted_id}))


# ------------------- Resultados de una campaña -------------------
@api.get("/campanas/{campana_id}/resultados")
async def resultados_campana(campana_id: str):
    docs = await db.resultados.find({"campana_id": oid(campana_id)}).sort("creado_en", 1).to_list(500)
    return [limpiar(d) for d in docs]


def _latest_por_especialista(resultados):
    ultimo = {}
    for r in resultados:
        ultimo[r["especialista"]] = r
    return ultimo


# ------------------- Ejecutar especialista -------------------
@api.post("/especialistas/{especialista}/{campana_id}")
async def correr_especialista(especialista: str, campana_id: str, datos: EspecialistaIn):
    if especialista not in PASO_POR_ESPECIALISTA:
        raise HTTPException(400, "Especialista desconocido")

    campana = await db.campanas.find_one({"_id": oid(campana_id)})
    if not campana:
        raise HTTPException(404, "Campaña no encontrada")

    agencia = await db.agencias.find_one({"_id": campana["agencia_id"]}) if campana.get("agencia_id") else {}
    agencia = agencia or {}
    tipo_campana = campana["tipo"]
    paso = PASO_POR_ESPECIALISTA[especialista]

    # Guardar respuestas (una por pregunta).
    await db.respuestas.delete_many({"campana_id": oid(campana_id), "paso": paso})
    for pid, valor in datos.respuestas.items():
        await db.respuestas.insert_one({
            "campana_id": oid(campana_id),
            "paso": paso,
            "pregunta_id": pid,
            "respuesta": valor,
            "creado_en": ahora(),
        })

    # Resultados previos aprobados de esta campaña.
    previos_docs = await db.resultados.find(
        {"campana_id": oid(campana_id), "aprobado": True}
    ).sort("creado_en", 1).to_list(100)
    resultados_previos = {d["especialista"]: d["contenido"] for d in previos_docs
                          if d["especialista"] != especialista}

    # Versión: incrementa sobre la última de este especialista en esta campaña.
    ultima = await db.resultados.find_one(
        {"campana_id": oid(campana_id), "especialista": especialista}, sort=[("version", -1)]
    )
    version = (ultima["version"] + 1) if ultima else 1

    try:
        contenido, fuentes = await ejecutar_especialista(
            db, especialista, agencia, datos.respuestas, tipo_campana, resultados_previos
        )
    except Exception as e:  # noqa: BLE001
        logger.exception("Fallo del especialista %s", especialista)
        raise HTTPException(502, f"El especialista no pudo generar el resultado: {e}")

    doc = {
        "campana_id": oid(campana_id),
        "especialista": especialista,
        "titulo_corto": contenido.get("titulo_corto", ""),
        "contenido": contenido,
        "fuentes_usadas": fuentes,
        "aprobado": False,
        "version": version,
        "creado_en": ahora(),
    }
    res = await db.resultados.insert_one(doc)
    return limpiar(await db.resultados.find_one({"_id": res.inserted_id}))


# ------------------- Landing: HTML de verdad -------------------
async def _html_de_landing(resultado_id: str) -> tuple[str, str]:
    """Devuelve (html, nombre_de_archivo) de un resultado del especialista de landing."""
    resultado = await db.resultados.find_one({"_id": oid(resultado_id)})
    if not resultado:
        raise HTTPException(404, "Resultado no encontrado")
    if resultado["especialista"] != "landing":
        raise HTTPException(400, "Este resultado no es una landing")

    campana = await db.campanas.find_one({"_id": resultado["campana_id"]})
    agencia = {}
    if campana and campana.get("agencia_id"):
        agencia = await db.agencias.find_one({"_id": campana["agencia_id"]}) or {}

    datos = resultado["contenido"]
    html = render_landing(
        datos,
        {"nombre": agencia.get("nombre_agencia", ""), "ciudad": agencia.get("zona", "")},
        # La landing conserva la marca con la que se dibujó; si no tiene, la de
        # la agencia; y si tampoco, una neutra. Nunca la de InmoMatic.
        datos.get("marca") or agencia.get("marca"),
    )
    base = (resultado.get("titulo_corto") or "landing").lower()
    nombre = "".join(c if c.isalnum() else "-" for c in base).strip("-") or "landing"
    return html, f"landing-{nombre[:50]}.html"


@api.get("/resultados/{resultado_id}/landing.html", response_class=HTMLResponse)
async def landing_html(resultado_id: str):
    """Vista previa real, para incrustar en un iframe."""
    html, _ = await _html_de_landing(resultado_id)
    return HTMLResponse(content=html)


@api.get("/resultados/{resultado_id}/landing/descargar", response_class=HTMLResponse)
async def landing_descargar(resultado_id: str):
    """El mismo documento, como descarga."""
    html, nombre = await _html_de_landing(resultado_id)
    return HTMLResponse(
        content=html,
        headers={"Content-Disposition": f'attachment; filename="{nombre}"'},
    )


# ------------------- Aprobar resultado -------------------
@api.post("/resultados/{resultado_id}/aprobar")
async def aprobar_resultado(resultado_id: str):
    resultado = await db.resultados.find_one({"_id": oid(resultado_id)})
    if not resultado:
        raise HTTPException(404, "Resultado no encontrado")

    especialista = resultado["especialista"]
    campana_id = resultado["campana_id"]

    # Desmarca otras versiones del mismo especialista, aprueba esta.
    await db.resultados.update_many(
        {"campana_id": campana_id, "especialista": especialista},
        {"$set": {"aprobado": False}},
    )
    await db.resultados.update_one({"_id": oid(resultado_id)}, {"$set": {"aprobado": True}})

    paso = PASO_POR_ESPECIALISTA[especialista]
    if paso >= 4:
        await db.campanas.update_one({"_id": campana_id}, {"$set": {"paso_actual": 4, "estado": "completada"}})
    else:
        await db.campanas.update_one({"_id": campana_id}, {"$set": {"paso_actual": paso + 1}})

    return {"ok": True, "paso_actual": min(paso + 1, 4)}


# ------------------- Reutilizar resultados guardados -------------------
@api.get("/especialistas/{especialista}/guardados")
async def guardados(especialista: str, campana_id: str):
    """Resultados aprobados de OTRAS campañas para reutilizar (cliente_ideal / oferta)."""
    docs = await db.resultados.find(
        {"especialista": especialista, "aprobado": True, "campana_id": {"$ne": oid(campana_id)}}
    ).sort("creado_en", -1).to_list(50)
    # Uno por titulo_corto para no repetir.
    vistos = set()
    salida = []
    for d in docs:
        clave = d.get("titulo_corto", "")
        if clave in vistos:
            continue
        vistos.add(clave)
        salida.append(limpiar(d))
    return salida


@api.post("/campanas/{campana_id}/usar-guardado")
async def usar_guardado(campana_id: str, datos: UsarGuardadoIn):
    origen = await db.resultados.find_one({"_id": oid(datos.resultado_id)})
    if not origen:
        raise HTTPException(404, "Resultado no encontrado")
    especialista = origen["especialista"]
    if especialista not in PASO_POR_ESPECIALISTA:
        raise HTTPException(400, "Especialista no válido para reutilizar")
    await db.resultados.update_many(
        {"campana_id": oid(campana_id), "especialista": especialista},
        {"$set": {"aprobado": False}},
    )
    doc = {
        "campana_id": oid(campana_id),
        "especialista": especialista,
        "titulo_corto": origen["titulo_corto"],
        "contenido": origen["contenido"],
        "fuentes_usadas": origen.get("fuentes_usadas", []),
        "aprobado": True,
        "version": 1,
        "creado_en": ahora(),
    }
    res = await db.resultados.insert_one(doc)
    paso = PASO_POR_ESPECIALISTA[especialista]
    await db.campanas.update_one({"_id": oid(campana_id)}, {"$set": {"paso_actual": paso + 1}})
    return limpiar(await db.resultados.find_one({"_id": res.inserted_id}))


# ------------------- Admin: base de conocimiento -------------------
@api.get("/conocimiento")
async def listar_conocimiento():
    docs = await db.base_conocimiento.find().sort("creado_en", -1).to_list(500)
    salida = []
    for d in docs:
        d.pop("embedding", None)
        salida.append(limpiar(d))
    return salida


@api.post("/conocimiento")
async def crear_conocimiento(datos: ConocimientoIn):
    doc = datos.model_dump()
    doc["creado_en"] = ahora()
    doc["embedding"] = []
    res = await db.base_conocimiento.insert_one(doc)
    creado = await db.base_conocimiento.find_one({"_id": res.inserted_id})
    creado.pop("embedding", None)
    return limpiar(creado)


@api.put("/conocimiento/{item_id}")
async def editar_conocimiento(item_id: str, datos: ConocimientoIn):
    doc = datos.model_dump()
    await db.base_conocimiento.update_one({"_id": oid(item_id)}, {"$set": doc})
    actualizado = await db.base_conocimiento.find_one({"_id": oid(item_id)})
    actualizado.pop("embedding", None)
    return limpiar(actualizado)


# ------------------- Admin: prompts de sistema -------------------
@api.get("/prompts")
async def listar_prompts():
    docs = await db.prompts_sistema.find().sort("especialista", 1).to_list(50)
    return [limpiar(d) for d in docs]


@api.put("/prompts/{prompt_id}")
async def editar_prompt(prompt_id: str, datos: PromptIn):
    await db.prompts_sistema.update_one({"_id": oid(prompt_id)}, {"$set": {"contenido": datos.contenido}})
    return limpiar(await db.prompts_sistema.find_one({"_id": oid(prompt_id)}))


# ------------------- Arranque: siembra -------------------
@app.on_event("startup")
async def sembrar():
    # Asegura que las colecciones existan.
    nombres = await db.list_collection_names()
    for col in ["agencias", "campanas", "inmuebles", "respuestas", "resultados",
                "base_conocimiento", "prompts_sistema"]:
        if col not in nombres:
            await db.create_collection(col)

    if await db.prompts_sistema.count_documents({}) == 0:
        for p in PROMPTS:
            await db.prompts_sistema.insert_one({**p, "creado_en": ahora()})
        logger.info("Prompts de sistema sembrados.")

    if await db.base_conocimiento.count_documents({}) == 0:
        for f in FRAGMENTOS:
            await db.base_conocimiento.insert_one({**f, "embedding": [], "creado_en": ahora()})
        logger.info("Base de conocimiento sembrada (%s fragmentos).", len(FRAGMENTOS))


app.include_router(api)
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
