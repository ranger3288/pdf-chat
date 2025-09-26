# backend/app/embeddings.py
import os
from typing import List
from openai import OpenAI
from .openai_client import get_openai_client

client = get_openai_client()

EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")

def embed_texts(texts: List[str]) -> List[list]:
    resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
    return [d.embedding for d in resp.data]
