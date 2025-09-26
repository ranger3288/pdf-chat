# backend/app/pdf_parser.py
from typing import List
import pdfplumber


def extract_text_from_pdf(path: str) -> str:
    all_text = []
    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                all_text.append(text)
    return "\n\n".join(all_text)


def chunk_text(text: str, chunk_size=800, overlap=100) -> List[str]:
    tokens = text.split()
    chunks = []
    i = 0
    while i < len(tokens):
        chunk = tokens[i:i+chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks