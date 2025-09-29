# backend/app/pdf_parser.py
from typing import List
import pdfplumber


def extract_text_from_pdf(path: str) -> str:
    all_text = []
    try:
        with pdfplumber.open(path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                print(f"Page {i+1} text length: {len(text) if text else 0}")
                if text:
                    all_text.append(text)
        result = "\n\n".join(all_text)
        print(f"Total extracted text length: {len(result)}")
        return result
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def chunk_text(text: str, chunk_size=800, overlap=100) -> List[str]:
    tokens = text.split()
    chunks = []
    i = 0
    while i < len(tokens):
        chunk = tokens[i:i+chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - overlap
    return chunks