# backend/app/vector_store.py
import os
import uuid
from sqlalchemy import create_engine, MetaData, Table, Column, String, JSON, TIMESTAMP, text
from sqlalchemy.dialects.postgresql import UUID
from pgvector.sqlalchemy import Vector

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError("DATABASE_URL environment variable not set")

engine = create_engine(DATABASE_URL)
metadata = MetaData()

documents = Table(
    "documents", metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("filename", String),
    Column("uploaded_at", TIMESTAMP, server_default=text("now()"))
)

# embedding dimension will depend on model; default to 1536
EMBED_DIM = int(os.getenv("EMBED_DIM", "1536"))

document_chunks = Table(
    "document_chunks", metadata,
    Column("id", UUID(as_uuid=True), primary_key=True, default=uuid.uuid4),
    Column("document_id", UUID(as_uuid=True)),
    Column("chunk_text", String),
    Column("metadata", JSON),
    Column("embedding", Vector(EMBED_DIM))
)

# create tables if they don't exist (simple dev helper)
metadata.create_all(engine)


def insert_document(conn, filename):
    id = uuid.uuid4()
    conn.execute(documents.insert().values(id=id, filename=filename))
    return id


def insert_chunk(conn, document_id, text, embedding, metadata_obj=None):
    conn.execute(document_chunks.insert().values(
        id=uuid.uuid4(),
        document_id=document_id,
        chunk_text=text,
        metadata=metadata_obj or {},
        embedding=embedding
    ))


def similarity_search(conn, query_embedding, k=4):
    # Use the <=> operator (L2) or cosine depending on pgvector config.
    q = """
    SELECT id, document_id, chunk_text, metadata, embedding <=> :q AS distance
    FROM document_chunks
    ORDER BY embedding <=> :q
    LIMIT :k
    """
    rows = conn.execute(text(q), {"q": query_embedding, "k": k}).fetchall()
    results = []
    for r in rows:
        results.append({
            "id": str(r[0]),
            "document_id": str(r[1]),
            "chunk_text": r[2],
            "metadata": r[3],
            "distance": float(r[4])
        })
    return results