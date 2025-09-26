# backend/app/api.py
import os
import shutil
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from pydantic import BaseModel
from .pdf_parser import extract_text_from_pdf, chunk_text
from .embeddings import embed_texts
from .vector_store import engine, insert_document, insert_chunk, similarity_search
import openai

app = FastAPI()
openai.api_key = os.getenv("OPENAI_API_KEY")

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDFs allowed")
    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
    with open(tmp.name, "wb") as f:
        shutil.copyfileobj(file.file, f)
    text = extract_text_from_pdf(tmp.name)
    if not text.strip():
        raise HTTPException(status_code=400, detail="PDF contained no extractable text")
    chunks = chunk_text(text)
    embeddings = embed_texts(chunks)
    with engine.begin() as conn:
        doc_id = insert_document(conn, file.filename)
        for chunk, emb in zip(chunks, embeddings):
            insert_chunk(conn, doc_id, chunk, emb, metadata={"source": file.filename})
    os.unlink(tmp.name)
    return {"status": "ok", "document_id": str(doc_id), "num_chunks": len(chunks)}


class QueryPayload(BaseModel):
    query: str
    k: int = 4

@app.post("/query")
async def query_documents(payload: QueryPayload):
    if not payload.query.strip():
        raise HTTPException(status_code=400, detail="query cannot be empty")
    q_emb = embed_texts([payload.query])[0]
    with engine.connect() as conn:
        rows = similarity_search(conn, q_emb, k=payload.k)
    top_texts = [r["chunk_text"] for r in rows]
    # Compose prompt
    system_prompt = "You are an assistant that answers questions using the provided document excerpts. Cite the source filename when relevant."
    user_prompt = f"Excerpts:\n\n{'\n\n'.join(top_texts)}\n\nQuestion: {payload.query}\n\nAnswer concisely and cite sources."
    resp = openai.ChatCompletion.create(
        model=os.getenv("CHAT_MODEL", "gpt-4o-mini"),
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ],
        temperature=0.0,
        max_tokens=500
    )
    answer = resp["choices"][0]["message"]["content"]
    return {"answer": answer, "sources": rows}