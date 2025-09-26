# backend/app/api.py
import os, shutil, tempfile
from typing import Optional
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from .openai_client import get_openai_client

from .pdf_parser import extract_text_from_pdf, chunk_text
from .embeddings import embed_texts
from .vector_store import insert_document, insert_chunk, similarity_search

app = FastAPI()

client = get_openai_client()

CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")

class QueryBody(BaseModel):
    query: str
    document_id: Optional[str] = None
    top_k: int = 5

@app.get("/health")
def health():
    return {"status": "ok"}

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF")
    # save to temp
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_path = tmp.name
        shutil.copyfileobj(file.file, tmp)
    try:
        text = extract_text_from_pdf(tmp_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No extractable text found in PDF")
        chunks = chunk_text(text, chunk_size=800, overlap=120)
        doc_id = insert_document(file.filename)
        embeddings = embed_texts(chunks)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            insert_chunk(
                doc_id,
                chunk,
                {"source": file.filename, "index": i},
                emb
            )
        return {"document_id": doc_id, "chunks": len(chunks), "filename": file.filename}
    finally:
        try: os.remove(tmp_path)
        except Exception: pass

@app.post("/query")
def query(payload: QueryBody):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    q_emb = embed_texts([payload.query])[0]
    rows = similarity_search(q_emb, k=payload.top_k)

    excerpts = "\n\n".join(
        f"[{i+1}] {r['chunk_text']}" for i, r in enumerate(rows)
    ) or "(no context found)"

    system = (
        "You answer questions about a PDF using only the provided excerpts. "
        "If the context is insufficient, say so briefly. Cite sources like [1], [2] at the end of sentences."
    )
    user = f"Excerpts:\n\n{excerpts}\n\nQuestion: {payload.query}\n\nAnswer:"
    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        temperature=0.0,
        max_tokens=500,
        messages=[{"role": "system", "content": system},
                  {"role": "user", "content": user}]
    )
    answer = resp.choices[0].message.content
    return {"answer": answer, "sources": rows}
