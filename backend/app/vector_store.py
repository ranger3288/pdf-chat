# backend/app/vector_store.py
import uuid, math
from typing import Dict, Any, List

DOCUMENTS: Dict[str, Dict[str, Any]] = {}
CHUNKS: List[Dict[str, Any]] = []

def insert_document(filename: str) -> str:
    doc_id = str(uuid.uuid4())
    DOCUMENTS[doc_id] = {"id": doc_id, "filename": filename}
    return doc_id

def insert_chunk(document_id: str, chunk_text: str, metadata: Dict[str, Any], embedding: List[float]) -> str:
    cid = str(uuid.uuid4())
    CHUNKS.append({
        "id": cid,
        "document_id": document_id,
        "chunk_text": chunk_text,
        "metadata": metadata,
        "embedding": embedding,
    })
    return cid

def _cosine(a: List[float], b: List[float]) -> float:
    dot = sum(x*y for x, y in zip(a, b))
    na = math.sqrt(sum(x*x for x in a)) or 1e-12
    nb = math.sqrt(sum(y*y for y in b)) or 1e-12
    return dot / (na * nb)

def similarity_search(query_embedding: List[float], k: int = 5) -> List[Dict[str, Any]]:
    scored = [(1 - _cosine(query_embedding, ch["embedding"]), ch) for ch in CHUNKS]
    scored.sort(key=lambda t: t[0])
    out = []
    for dist, ch in scored[:k]:
        item = {k: v for k, v in ch.items() if k != "embedding"}
        item["distance"] = float(dist)
        out.append(item)
    return out
