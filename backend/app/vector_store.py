# backend/app/vector_store.py
import uuid
import json
from typing import Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import text
from .database import DocumentChunk, Document

def insert_document(db: Session, user_id: str, filename: str, original_filename: str, file_size: int = None) -> str:
    """Insert a new document and return its ID"""
    doc = Document(
        user_id=user_id,
        filename=filename,
        original_filename=original_filename,
        file_size=file_size
    )
    db.add(doc)
    db.commit()
    db.refresh(doc)
    return str(doc.id)

def insert_chunk(db: Session, document_id: str, chunk_text: str, metadata: Dict[str, Any], embedding: List[float], chunk_index: int) -> str:
    """Insert a new document chunk with embedding"""
    chunk = DocumentChunk(
        document_id=document_id,
        chunk_text=chunk_text,
        chunk_index=chunk_index,
        chunk_metadata=json.dumps(metadata),
        embedding=embedding
    )
    db.add(chunk)
    db.commit()
    db.refresh(chunk)
    return str(chunk.id)

def similarity_search(db: Session, query_embedding: List[float], document_id: str = None, k: int = 5) -> List[Dict[str, Any]]:
    """Search for similar chunks using pgvector"""
    # Convert embedding to string format for PostgreSQL
    embedding_str = "[" + ",".join(map(str, query_embedding)) + "]"
    
    if document_id:
        # Search within specific document using f-string (simpler approach)
        query_str = f"""
            SELECT id, document_id, chunk_text, chunk_metadata, 
                   1 - (embedding <=> '{embedding_str}'::vector) as similarity
            FROM document_chunks 
            WHERE document_id = '{document_id}'
            ORDER BY embedding <=> '{embedding_str}'::vector
            LIMIT {k}
        """
        result = db.execute(text(query_str))
    else:
        # Search across all documents
        query_str = f"""
            SELECT id, document_id, chunk_text, chunk_metadata,
                   1 - (embedding <=> '{embedding_str}'::vector) as similarity
            FROM document_chunks
            ORDER BY embedding <=> '{embedding_str}'::vector
            LIMIT {k}
        """
        result = db.execute(text(query_str))
    
    chunks = []
    for row in result:
        chunk_data = {
            "id": str(row.id),
            "document_id": str(row.document_id),
            "chunk_text": row.chunk_text,
            "metadata": json.loads(row.chunk_metadata) if row.chunk_metadata else {},
            "distance": 1 - row.similarity,
            "similarity": row.similarity
        }
        chunks.append(chunk_data)
    
    return chunks

def get_document_chunks(db: Session, document_id: str) -> List[Dict[str, Any]]:
    """Get all chunks for a specific document"""
    chunks = db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).all()
    return [
        {
            "id": str(chunk.id),
            "document_id": str(chunk.document_id),
            "chunk_text": chunk.chunk_text,
            "metadata": json.loads(chunk.chunk_metadata) if chunk.chunk_metadata else {},
            "chunk_index": chunk.chunk_index
        }
        for chunk in chunks
    ]

def delete_document_chunks(db: Session, document_id: str):
    """Delete all chunks for a document"""
    db.query(DocumentChunk).filter(DocumentChunk.document_id == document_id).delete()
    db.commit()
