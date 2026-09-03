"""Conexión a MongoDB y utilidades de serialización."""
import os
from datetime import datetime, timezone
from pathlib import Path

from bson import ObjectId
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient

load_dotenv(Path(__file__).parent / ".env")

client = AsyncIOMotorClient(os.environ["MONGO_URL"])
db = client[os.environ["DB_NAME"]]


def ahora():
    return datetime.now(timezone.utc)


def oid(valor):
    """Convierte a ObjectId de forma segura."""
    return valor if isinstance(valor, ObjectId) else ObjectId(valor)


def limpiar(doc):
    """Serializa un documento de Mongo a JSON: _id -> id, ObjectId -> str."""
    if doc is None:
        return None
    salida = {}
    for k, v in doc.items():
        if k == "_id":
            salida["id"] = str(v)
        elif isinstance(v, ObjectId):
            salida[k] = str(v)
        elif isinstance(v, datetime):
            salida[k] = v.isoformat()
        elif isinstance(v, list):
            salida[k] = [limpiar(x) if isinstance(x, dict) else (str(x) if isinstance(x, ObjectId) else x) for x in v]
        elif isinstance(v, dict):
            salida[k] = limpiar(v)
        else:
            salida[k] = v
    return salida
