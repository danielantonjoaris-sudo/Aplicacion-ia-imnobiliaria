"""Los cuatro especialistas. Cada uno es una función pura con entradas por parámetro."""
import asyncio
import json

from llm import generar_json
from retrieval import recuperar_conocimiento

# Etiquetas legibles de las preguntas para dar contexto al modelo.
ETIQUETAS = {
    "cliente_ideal": {
        "tipo_propietario": "Tipo de propietario a captar",
        "tipo_vivienda": "Tipo de vivienda que suele tener",
        "franja_precio": "Franja de precio",
    },
    "oferta": {
        "que_das": "Lo que da al propietario y otros no",
        "tiempo_venta": "Tiempo medio en vender",
        "compromiso": "Compromisos por escrito",
    },
    "anuncios": {
        "accion": "Acción que debe hacer quien ve el anuncio",
        "tono": "Cómo quiere sonar",
        "resultado_real": "Resultado real que se puede contar",
    },
    "landing": {
        "datos": "Datos que quiere pedir",
        "testimonios": "Reseñas o testimonios de clientes",
    },
}

# Esquema JSON obligatorio por especialista (para instruir y validar).
ESQUEMAS = {
    "cliente_ideal": {
        "claves": ["titulo_corto", "perfil", "momento_vital", "que_le_preocupa",
                   "que_le_frena", "que_le_haria_actuar", "donde_encontrarle"],
        "descripcion": """{
  "titulo_corto": "string, máx 6 palabras, ej: Heredero de piso en Chamberí",
  "perfil": "string de 2-3 frases",
  "momento_vital": "string",
  "que_le_preocupa": [{"titulo": "string", "frase_textual": "string en primera persona, entre comillas"}],
  "que_le_frena": ["string", "..."],
  "que_le_haria_actuar": ["string", "..."],
  "donde_encontrarle": ["string", "..."]
}""",
    },
    "oferta": {
        "claves": ["titulo_corto", "nombre_oferta", "promesa_principal", "que_incluye",
                   "eliminador_de_riesgo", "por_que_es_creible"],
        "descripcion": """{
  "titulo_corto": "string, el nombre de la oferta",
  "nombre_oferta": "string, nombre propio del mecanismo",
  "promesa_principal": "string, una frase",
  "que_incluye": [{"titulo": "string", "descripcion": "string"}],
  "eliminador_de_riesgo": "string",
  "por_que_es_creible": "string"
}""",
    },
    "anuncios": {
        "claves": ["titulo_corto", "anuncios"],
        "descripcion": """{
  "titulo_corto": "string",
  "anuncios": [
    {"angulo": "etiqueta corta", "gancho": "2-3 líneas", "cuerpo": "string",
     "llamada_a_la_accion": "string", "por_que_funciona": "una frase"}
  ]  // EXACTAMENTE 5 objetos
}""",
    },
    "landing": {
        "claves": ["titulo_corto", "titular", "subtitular", "beneficios",
                   "testimonio", "campos_formulario", "llamada_a_la_accion"],
        "descripcion": """{
  "titulo_corto": "string",
  "titular": "string",
  "subtitular": "string",
  "beneficios": [{"titulo": "string", "texto": "string"}],  // 3 objetos
  "testimonio": {"texto": "string", "autor": "string", "es_ejemplo": true/false},
  "campos_formulario": ["string", "..."],
  "llamada_a_la_accion": "string"
}""",
    },
}

TEMA_POR_ESPECIALISTA = {
    "cliente_ideal": "cliente_ideal",
    "oferta": "oferta",
    "anuncios": "anuncios",
    "landing": "landing",
}


def _formatear_respuestas(especialista, respuestas):
    etiquetas = ETIQUETAS[especialista]
    lineas = []
    for pid, valor in respuestas.items():
        etiqueta = etiquetas.get(pid, pid)
        if isinstance(valor, list):
            valor = ", ".join(str(v) for v in valor)
        if str(valor).strip():
            lineas.append(f"- {etiqueta}: {valor}")
    return "\n".join(lineas) if lineas else "(sin respuestas)"


def _formatear_fragmentos(fragmentos):
    bloques = []
    for f in fragmentos:
        bloques.append(f"[{f['titulo']} — fuente: {f['fuente']}]\n{f['contenido']}")
    return "\n\n".join(bloques) if bloques else "(sin fragmentos)"


def _formatear_previos(resultados_previos):
    if not resultados_previos:
        return ""
    partes = []
    for esp, contenido in resultados_previos.items():
        partes.append(f"### Resultado del especialista '{esp}':\n{json.dumps(contenido, ensure_ascii=False)}")
    return "\n\n".join(partes)


async def cargar_prompt(db, especialista, tipo_campana):
    doc = await db.prompts_sistema.find_one({"especialista": especialista, "tipo_campana": tipo_campana})
    if not doc:
        doc = await db.prompts_sistema.find_one({"especialista": especialista})
    return doc["contenido"] if doc else "Eres un especialista de marketing inmobiliario español."


# Ángulos (niveles de consciencia) para repartir los 5 anuncios.
ANGULOS_ANUNCIOS = [
    "Nivel inconsciente del problema: el propietario cree que su piso se vende solo colgándolo. Ábrele los ojos con un dato o una realidad incómoda.",
    "Nivel consciente del problema: sabe que algo no funciona (visitas sin ofertas, meses colgado) pero no sabe qué. Nombra el problema concreto y promete un diagnóstico.",
    "Nivel consciente de la solución: sabe que necesita una agencia pero duda de cuál. Compite con tu mecanismo propio y tu forma de trabajar.",
    "Nivel consciente de tu propuesta: ya sabe lo que ofreces, le falta el empujón. Oferta directa, garantía y urgencia real.",
    "Ángulo de prueba social y autoridad de zona: apóyate en un resultado concreto de la zona (márcalo con [Supuesto] si te lo inventas) para generar confianza.",
]

_CLAVES_UN_ANUNCIO = ["angulo", "gancho", "cuerpo", "llamada_a_la_accion", "por_que_funciona"]

_ESQUEMA_UN_ANUNCIO = """{
  "angulo": "etiqueta corta que resuma el ángulo",
  "gancho": "2-3 líneas, las tres primeras líneas del anuncio",
  "cuerpo": "el cuerpo del anuncio",
  "llamada_a_la_accion": "string",
  "por_que_funciona": "una frase"
}"""


async def _generar_un_anuncio(prompt_sistema, base_texto, angulo_hint, accion, tono, session_id):
    user_text = f"""{base_texto}

Escribe UN SOLO anuncio de captación con este enfoque:
- Ángulo obligatorio: {angulo_hint}
- La gente que lo vea debe: {accion}
- Tono: {tono}

DEVUELVE ÚNICAMENTE un objeto JSON válido con EXACTAMENTE este esquema, sin texto alrededor, sin ```:
{_ESQUEMA_UN_ANUNCIO}"""
    return await generar_json(prompt_sistema, user_text, _CLAVES_UN_ANUNCIO, session_id=session_id)


async def ejecutar_especialista(db, especialista, agencia, respuestas, tipo_campana, resultados_previos):
    """Ejecuta un especialista y devuelve (contenido, fuentes_usadas).

    Todas las entradas llegan por parámetro: no lee estado de sesión ni del asistente.
    """
    tema = TEMA_POR_ESPECIALISTA[especialista]
    esquema = ESQUEMAS[especialista]

    consulta = f"{tema} {agencia.get('zona', '')} " + " ".join(
        [", ".join(v) if isinstance(v, list) else str(v) for v in respuestas.values() if v]
    )

    fragmentos = await recuperar_conocimiento(db, tema, tipo_campana, consulta)
    prompt_sistema = await cargar_prompt(db, especialista, tipo_campana)

    bloque_previos = _formatear_previos(resultados_previos)
    base_texto = f"""DATOS DE LA AGENCIA
- Nombre: {agencia.get('nombre_agencia')}
- Zona de trabajo: {agencia.get('zona')}
- Tamaño del equipo: {agencia.get('tamano_equipo')}

RESPUESTAS DEL AGENTE EN ESTE TRAMO
{_formatear_respuestas(especialista, respuestas)}

{("RESULTADOS DE ESPECIALISTAS ANTERIORES" + chr(10) + bloque_previos + chr(10)) if bloque_previos else ""}
FRAGMENTOS DEL MÉTODO (úsalos y cítalos, no los ignores)
{_formatear_fragmentos(fragmentos)}"""

    fuentes = [{"titulo": f["titulo"], "fuente": f["fuente"]} for f in fragmentos]
    sesion = f"{especialista}-{agencia.get('nombre_agencia', 'x')}"

    # Anuncios: 5 llamadas cortas en paralelo (evita el timeout del ingress).
    if especialista == "anuncios":
        accion = respuestas.get("accion", "pedir una valoración gratis de su casa")
        tono = respuestas.get("tono", "cercano y de barrio")
        if isinstance(accion, list):
            accion = ", ".join(accion)
        if isinstance(tono, list):
            tono = ", ".join(tono)
        tareas = [
            _generar_un_anuncio(prompt_sistema, base_texto, ANGULOS_ANUNCIOS[i], accion, tono, f"{sesion}-{i}")
            for i in range(5)
        ]
        anuncios = await asyncio.gather(*tareas)
        zona = agencia.get("zona") or "tu zona"
        contenido = {"titulo_corto": f"5 anuncios de captación · {zona}", "anuncios": list(anuncios)}
        return contenido, fuentes

    # Resto de especialistas: una sola llamada con su esquema completo.
    user_text = f"""{base_texto}

DEVUELVE ÚNICAMENTE un objeto JSON válido con EXACTAMENTE este esquema, sin texto alrededor, sin ```:
{esquema['descripcion']}"""

    contenido = await generar_json(prompt_sistema, user_text, esquema["claves"], session_id=sesion)
    return contenido, fuentes
