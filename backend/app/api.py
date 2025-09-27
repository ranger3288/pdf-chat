# backend/app/api.py
import os, shutil, tempfile
from typing import Optional, List
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from pydantic import BaseModel
from datetime import datetime
import uuid

from .openai_client import get_openai_client
from .pdf_parser import extract_text_from_pdf, chunk_text
from .embeddings import embed_texts
from .vector_store import insert_document, insert_chunk, similarity_search, get_document_chunks, delete_document_chunks
from .database import get_db, User, Document, ChatSession, ChatMessage, create_tables

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure this properly for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create tables on startup
@app.on_event("startup")
async def startup_event():
    create_tables()

client = get_openai_client()
CHAT_MODEL = os.getenv("CHAT_MODEL", "gpt-4o-mini")
INTERNAL_API_SECRET = os.getenv("INTERNAL_API_SECRET", "your-internal-secret-change-in-production")

# Internal authentication for Next.js proxy calls
def verify_internal_auth(x_internal_secret: str = Header(None)):
    if not x_internal_secret or x_internal_secret != INTERNAL_API_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")
    return True

# Get user from headers (set by Next.js proxy)
def get_user_from_headers(
    x_user_email: str = Header(None),
    x_user_name: str = Header(None),
    db: Session = Depends(get_db)
) -> User:
    if not x_user_email:
        raise HTTPException(status_code=401, detail="User email required")
    
    # Create or get user
    user = db.query(User).filter(User.email == x_user_email).first()
    if not user:
        user = User(
            email=x_user_email,
            name=x_user_name or "Unknown User"
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    
    return user

class QueryBody(BaseModel):
    query: str

class ChatCreate(BaseModel):
    document_id: str
    title: Optional[str] = None

@app.get("/api/healthz")
def health():
    return {"ok": True}

@app.post("/api/upload")
async def upload_pdf(
    file: UploadFile = File(...),
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Upload a PDF document"""
    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Please upload a PDF")
    
    # Save to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp:
        tmp_path = tmp.name
        shutil.copyfileobj(file.file, tmp)
    
    try:
        text = extract_text_from_pdf(tmp_path)
        if not text.strip():
            raise HTTPException(status_code=400, detail="No extractable text found in PDF")
        
        chunks = chunk_text(text, chunk_size=800, overlap=100)
        doc_id = insert_document(
            db, 
            str(user.id), 
            file.filename, 
            file.filename,
            file.size
        )
        
        embeddings = embed_texts(chunks)
        for i, (chunk, emb) in enumerate(zip(chunks, embeddings)):
            insert_chunk(
                db,
                doc_id,
                chunk,
                {"source": file.filename, "index": i},
                emb,
                i
            )
        
        return {"document_id": doc_id}
    finally:
        try: 
            os.remove(tmp_path)
        except Exception: 
            pass

@app.get("/api/documents")
def get_user_documents(
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Get all documents for the current user"""
    documents = db.query(Document).filter(Document.user_id == user.id).all()
    return [
        {
            "id": str(doc.id),
            "filename": doc.original_filename,
            "created_at": doc.upload_date.isoformat()
        }
        for doc in documents
    ]

@app.get("/api/documents/{document_id}/chats")
def get_document_chats(
    document_id: str,
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Get all chats for a document"""
    # Verify document belongs to user
    document = db.query(Document).filter(
        Document.id == document_id,
        Document.user_id == user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    chats = db.query(ChatSession).filter(
        ChatSession.document_id == document_id,
        ChatSession.user_id == user.id
    ).all()
    
    return [
        {
            "id": str(chat.id),
            "title": chat.title,
            "created_at": chat.created_at.isoformat()
        }
        for chat in chats
    ]

@app.post("/api/chats")
def create_chat(
    chat_data: ChatCreate,
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Create a new chat"""
    # Verify document belongs to user
    document = db.query(Document).filter(
        Document.id == chat_data.document_id,
        Document.user_id == user.id
    ).first()
    
    if not document:
        raise HTTPException(status_code=404, detail="Document not found")
    
    # Use provided title or default
    title = chat_data.title or "New Chat"
    
    chat = ChatSession(
        user_id=user.id,
        document_id=chat_data.document_id,
        title=title
    )
    db.add(chat)
    db.commit()
    db.refresh(chat)
    
    return {
        "id": str(chat.id),
        "title": chat.title,
        "document_id": str(chat.document_id),
        "created_at": chat.created_at.isoformat()
    }

@app.get("/api/chats/{chat_id}/messages")
def get_chat_messages(
    chat_id: str,
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Get all messages for a chat"""
    chat = db.query(ChatSession).filter(
        ChatSession.id == chat_id,
        ChatSession.user_id == user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    messages = db.query(ChatMessage).filter(
        ChatMessage.session_id == chat_id
    ).order_by(ChatMessage.timestamp).all()
    
    return [
        {
            "id": str(msg.id),
            "role": msg.role,
            "content": msg.content,
            "created_at": msg.timestamp.isoformat()
        }
        for msg in messages
    ]

@app.post("/api/chats/{chat_id}/ask")
def ask_question(
    chat_id: str,
    query_data: QueryBody,
    _: bool = Depends(verify_internal_auth),
    user: User = Depends(get_user_from_headers),
    db: Session = Depends(get_db)
):
    """Ask a question in a chat"""
    if not query_data.query.strip():
        raise HTTPException(status_code=400, detail="Empty query")
    
    # Verify chat belongs to user
    chat = db.query(ChatSession).filter(
        ChatSession.id == chat_id,
        ChatSession.user_id == user.id
    ).first()
    
    if not chat:
        raise HTTPException(status_code=404, detail="Chat not found")
    
    # Get query embedding
    q_emb = embed_texts([query_data.query])[0]
    
    # Search for similar chunks in the document
    rows = similarity_search(db, q_emb, str(chat.document_id), k=8)
    
    # Take top 5 results
    top_rows = rows[:5]
    
    excerpts = "\n\n".join(
        f"[{i+1}] {r['chunk_text']}" for i, r in enumerate(top_rows)
    ) or "(no context found)"

    system = (
        "You answer questions about PDF documents using only the provided excerpts. "
        "If the context is insufficient, say so briefly. Cite sources like [1], [2] at the end of sentences."
    )
    user_prompt = f"Excerpts:\n\n{excerpts}\n\nQuestion: {query_data.query}\n\nAnswer:"
    
    resp = client.chat.completions.create(
        model=CHAT_MODEL,
        temperature=0.0,
        max_tokens=500,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_prompt}
        ]
    )
    answer = resp.choices[0].message.content
    
    # Save user message
    user_msg = ChatMessage(
        session_id=chat_id,
        role="user",
        content=query_data.query
    )
    db.add(user_msg)
    
    # Save assistant message
    assistant_msg = ChatMessage(
        session_id=chat_id,
        role="assistant",
        content=answer
    )
    db.add(assistant_msg)
    
    # Update chat timestamp
    chat.updated_at = datetime.utcnow()
    
    db.commit()
    
    return {
        "answer": answer, 
        "sources": [
            {
                "text": row['chunk_text'],
                "score": row['similarity'],
                "metadata": row['metadata']
            }
            for row in top_rows
        ]
    }