"""Recuperación de conocimiento aislada en una única función.

Nota: en este entorno la Universal Key no expone modelos de embeddings ni hay
búsqueda vectorial de MongoDB Atlas disponible, así que —tal y como contempla la
especificación— esta misma función implementa una búsqueda por texto sobre
`contenido`. Todo el comportamiento queda encapsulado aquí: nada cambia fuera.
"""
import logging
import re

logger = logging.getLogger(__name__)

_STOP = {"para", "como", "pero", "porque", "cuando", "donde", "todo", "poco",
         "mucho", "esta", "este", "esto", "unos", "unas", "sobre", "entre",
         "quiere", "tiene", "suele", "mueve", "cosa", "otra"}


async def recuperar_conocimiento(db, tema: str, tipo_campana: str, consulta: str, k: int = 5):
    """Devuelve los k fragmentos más relevantes filtrando por tema y tipo_campana.

    Búsqueda por texto (solapamiento de términos) sobre `contenido` y `titulo`.
    """
    filtro = {"temas": tema, "tipo_campana": {"$in": [tipo_campana, "ambas"]}}
    docs = await db.base_conocimiento.find(filtro).to_list(1000)
    if not docs:
        return []

    palabras = {p for p in re.findall(r"[a-záéíóúñü]+", consulta.lower())
                if len(p) > 3 and p not in _STOP}

    def puntua(d):
        texto = (d.get("contenido", "") + " " + d.get("titulo", "")).lower()
        return sum(texto.count(p) for p in palabras)

    docs.sort(key=puntua, reverse=True)
    return docs[:k]
