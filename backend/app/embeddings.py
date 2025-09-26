# backend/app/embeddings.py
import os
import openai
from typing import List


OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    raise RuntimeError("OPENAI_API_KEY environment variable not set")
openai.api_key = OPENAI_API_KEY


EMBED_MODEL = os.getenv("EMBED_MODEL", "text-embedding-3-small")


def embed_texts(texts: List[str]) -> List[list]:
    # returns list of vectors
    resp = openai.Embedding.create(model=EMBED_MODEL, input=texts)
    return [item["embedding"] for item in resp["data"]]