"""Tests de integración de InmoMatic. Usa el REACT_APP_BACKEND_URL público."""
import os
import time
from pathlib import Path

import pytest
import requests
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parents[2] / "frontend" / ".env")

BASE = os.environ["REACT_APP_BACKEND_URL"].rstrip("/") + "/api"
LLM_TIMEOUT = 120

session = requests.Session()
session.headers.update({"Content-Type": "application/json"})


# ---------- Seeds ----------
def test_prompts_seed():
    r = session.get(f"{BASE}/prompts", timeout=30)
    assert r.status_code == 200
    prompts = r.json()
    especialistas = sorted([p["especialista"] for p in prompts])
    assert especialistas == ["anuncios", "cliente_ideal", "landing", "oferta"]
    for p in prompts:
        assert p["tipo_campana"] == "captacion"


def test_conocimiento_seed():
    r = session.get(f"{BASE}/conocimiento", timeout=30)
    assert r.status_code == 200
    frags = r.json()
    assert len(frags) >= 12
    # Count by tema
    counts = {"cliente_ideal": 0, "oferta": 0, "anuncios": 0, "landing": 0}
    for f in frags:
        for t in f.get("temas", []):
            if t in counts:
                counts[t] += 1
    for tema, c in counts.items():
        assert c >= 3, f"tema {tema} tiene {c} fragmentos, esperado >=3"


# ---------- Fixture: agencia + campaña ----------
@pytest.fixture(scope="module")
def agencia():
    r = session.post(f"{BASE}/agencias", json={
        "nombre_agencia": "TEST_Fincas QA",
        "zona": "Chamberí, Madrid",
        "tamano_equipo": "3-5",
    })
    assert r.status_code == 200
    return r.json()


@pytest.fixture(scope="module")
def campana(agencia):
    r = session.post(f"{BASE}/campanas", json={"tipo": "captacion"})
    assert r.status_code == 200
    c = r.json()
    assert c["estado"] == "en_proceso"
    assert c["paso_actual"] == 1
    assert c["tipo"] == "captacion"
    return c


# Shared state
STATE = {}


def _run_especialista(especialista, campana_id, respuestas):
    r = session.post(
        f"{BASE}/especialistas/{especialista}/{campana_id}",
        json={"respuestas": respuestas},
        timeout=LLM_TIMEOUT,
    )
    assert r.status_code == 200, r.text
    return r.json()


def test_cliente_ideal_v1(campana):
    result = _run_especialista("cliente_ideal", campana["id"], {
        "tipo_propietario": "Herederos",
        "tipo_vivienda": "Piso antiguo",
        "franja_precio": "200-350k",
    })
    contenido = result["contenido"]
    for k in ["titulo_corto", "perfil", "momento_vital", "que_le_preocupa",
              "que_le_frena", "que_le_haria_actuar", "donde_encontrarle"]:
        assert k in contenido, f"Falta clave {k}"
    assert isinstance(contenido["que_le_preocupa"], list) and contenido["que_le_preocupa"]
    for item in contenido["que_le_preocupa"]:
        assert "titulo" in item and "frase_textual" in item
    fuentes = result["fuentes_usadas"]
    assert isinstance(fuentes, list) and len(fuentes) > 0
    for f in fuentes:
        assert "titulo" in f and "fuente" in f
    assert result["version"] == 1
    STATE["cliente_ideal_v1_id"] = result["id"]


def test_cliente_ideal_rehacer(campana):
    result = _run_especialista("cliente_ideal", campana["id"], {
        "tipo_propietario": "Herederos",
        "tipo_vivienda": "Piso antiguo",
        "franja_precio": "200-350k",
    })
    assert result["version"] == 2
    # GET resultados: both versions exist
    r = session.get(f"{BASE}/campanas/{campana['id']}/resultados", timeout=30)
    assert r.status_code == 200
    versiones = [x["version"] for x in r.json() if x["especialista"] == "cliente_ideal"]
    assert 1 in versiones and 2 in versiones
    STATE["cliente_ideal_v2_id"] = result["id"]


def test_aprobar_cliente_ideal(campana):
    rid = STATE["cliente_ideal_v2_id"]
    r = session.post(f"{BASE}/resultados/{rid}/aprobar", timeout=30)
    assert r.status_code == 200
    assert r.json()["paso_actual"] == 2
    # Verify campaign advanced
    c = session.get(f"{BASE}/campanas/{campana['id']}").json()
    assert c["paso_actual"] == 2


def test_oferta(campana):
    result = _run_especialista("oferta", campana["id"], {
        "que_das": "Fotos profesionales, home staging",
        "tiempo_venta": "45 días",
        "compromiso": "Sin permanencia",
    })
    for k in ["titulo_corto", "nombre_oferta", "promesa_principal", "que_incluye",
              "eliminador_de_riesgo", "por_que_es_creible"]:
        assert k in result["contenido"]
    r = session.post(f"{BASE}/resultados/{result['id']}/aprobar")
    assert r.status_code == 200


def test_anuncios(campana):
    result = _run_especialista("anuncios", campana["id"], {
        "accion": "Solicitar valoración",
        "tono": "Cercano y directo",
        "resultado_real": "Vendemos en 45 días de media",
    })
    anuncios = result["contenido"]["anuncios"]
    assert isinstance(anuncios, list)
    assert len(anuncios) == 5, f"Esperados 5 anuncios, recibidos {len(anuncios)}"
    for a in anuncios:
        for k in ["angulo", "gancho", "cuerpo", "llamada_a_la_accion", "por_que_funciona"]:
            assert k in a, f"Falta clave {k} en anuncio"
    r = session.post(f"{BASE}/resultados/{result['id']}/aprobar")
    assert r.status_code == 200


def test_landing_y_completada(campana):
    result = _run_especialista("landing", campana["id"], {
        "datos": "Nombre, teléfono, dirección",
        "testimonios": "No tengo, usa ejemplo",
    })
    c = result["contenido"]
    for k in ["titular", "subtitular", "beneficios", "testimonio", "campos_formulario", "llamada_a_la_accion"]:
        assert k in c
    assert isinstance(c["beneficios"], list) and len(c["beneficios"]) == 3
    for k in ["texto", "autor", "es_ejemplo"]:
        assert k in c["testimonio"]
    r = session.post(f"{BASE}/resultados/{result['id']}/aprobar")
    assert r.status_code == 200
    camp = session.get(f"{BASE}/campanas/{campana['id']}").json()
    assert camp["estado"] == "completada"


# ---------- Reutilizar ----------
def test_reutilizar_cliente_ideal():
    # Create a second campaign for same agencia (last created)
    r = session.post(f"{BASE}/campanas", json={"tipo": "captacion"})
    assert r.status_code == 200
    nueva = r.json()
    # Get guardados
    g = session.get(f"{BASE}/especialistas/cliente_ideal/guardados",
                    params={"campana_id": nueva["id"]})
    assert g.status_code == 200
    guardados = g.json()
    assert len(guardados) >= 1
    resultado_id = guardados[0]["id"]
    # Usar guardado
    u = session.post(f"{BASE}/campanas/{nueva['id']}/usar-guardado",
                     json={"resultado_id": resultado_id})
    assert u.status_code == 200
    assert u.json()["especialista"] == "cliente_ideal"
    # Paso debe haber avanzado
    camp = session.get(f"{BASE}/campanas/{nueva['id']}").json()
    assert camp["paso_actual"] == 2


# ---------- Admin conocimiento ----------
def test_conocimiento_crud():
    payload = {
        "fuente": "TEST_Fuente",
        "tipo": "clase",
        "titulo": "TEST_Titulo QA",
        "contenido": "Contenido de test para QA",
        "temas": ["cliente_ideal"],
        "tipo_campana": "captacion",
    }
    r = session.post(f"{BASE}/conocimiento", json=payload)
    assert r.status_code == 200
    creado = r.json()
    assert creado["titulo"] == "TEST_Titulo QA"
    item_id = creado["id"]

    # Listar
    lst = session.get(f"{BASE}/conocimiento").json()
    assert any(x["id"] == item_id for x in lst)

    # Editar
    payload["titulo"] = "TEST_Titulo Editado"
    e = session.put(f"{BASE}/conocimiento/{item_id}", json=payload)
    assert e.status_code == 200
    assert e.json()["titulo"] == "TEST_Titulo Editado"


# ---------- Admin prompts ----------
def test_prompt_edit_restore():
    prompts = session.get(f"{BASE}/prompts").json()
    prompt = next(p for p in prompts if p["especialista"] == "cliente_ideal")
    original = prompt["contenido"]
    new_content = original + "\n\n# marca_test_qa"
    r = session.put(f"{BASE}/prompts/{prompt['id']}", json={"contenido": new_content})
    assert r.status_code == 200
    updated = session.get(f"{BASE}/prompts").json()
    up = next(p for p in updated if p["id"] == prompt["id"])
    assert "marca_test_qa" in up["contenido"]
    # Restaurar
    session.put(f"{BASE}/prompts/{prompt['id']}", json={"contenido": original})
