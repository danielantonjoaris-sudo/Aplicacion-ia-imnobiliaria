"""Módulo único para todas las llamadas al LLM y a embeddings (Universal Key)."""
import json
import logging
import os
import re

import litellm
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.utils import get_integration_proxy_url

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ["EMERGENT_LLM_KEY"]
PROVEEDOR = "anthropic"
MODELO = "claude-sonnet-4-6"
MODELO_EMBEDDING = "text-embedding-3-small"


async def generar_texto(system_message: str, user_text: str, session_id: str = "inmomatic") -> str:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=session_id,
        system_message=system_message,
    ).with_model(PROVEEDOR, MODELO)
    return await chat.send_message(UserMessage(text=user_text))


def _extraer_json(raw: str) -> dict:
    texto = raw.strip()
    if texto.startswith("```"):
        texto = re.sub(r"^```(?:json)?\s*", "", texto)
        texto = re.sub(r"\s*```$", "", texto)
    inicio = texto.find("{")
    fin = texto.rfind("}")
    if inicio != -1 and fin != -1:
        texto = texto[inicio:fin + 1]
    return json.loads(texto)


async def generar_json(system_message: str, user_text: str, claves_obligatorias, session_id: str = "inmomatic") -> dict:
    """Genera JSON válido. Reintenta una vez si falla. Lanza excepción si vuelve a fallar."""
    ultimo_error = None
    for intento in range(2):
        try:
            raw = await generar_texto(system_message, user_text, session_id)
            data = _extraer_json(raw)
            faltan = [k for k in claves_obligatorias if k not in data]
            if faltan:
                raise ValueError(f"Faltan claves en el JSON: {faltan}")
            return data
        except Exception as e:  # noqa: BLE001
            ultimo_error = e
            logger.warning("Intento %s de generar JSON falló: %s", intento + 1, e)
    raise ValueError(f"El modelo no devolvió un JSON válido: {ultimo_error}")


async def generar_embedding(texto: str):
    """Embedding real de OpenAI a través del proxy de la Universal Key."""
    resp = await litellm.aembedding(
        model=MODELO_EMBEDDING,
        input=[texto],
        api_key=EMERGENT_LLM_KEY,
        api_base=get_integration_proxy_url() + "/llm",
        custom_llm_provider="openai",
    )
    data = resp["data"] if isinstance(resp, dict) else resp.data
    fila = data[0]
    return fila["embedding"] if isinstance(fila, dict) else fila.embedding
