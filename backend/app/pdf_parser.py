# backend/app/pdf_parser.py
from typing import List
import pdfplumber


def extract_text_from_pdf(path: str) -> str:
    all_text = []
    try:
        with pdfplumber.open(path) as pdf:
            print(f"PDF has {len(pdf.pages)} pages")
            # Process pages in parallel for faster extraction
            for i, page in enumerate(pdf.pages):
                text = page.extract_text()
                print(f"Page {i+1} text length: {len(text) if text else 0}")
                if text and text.strip():  # Only add non-empty text
                    all_text.append(text.strip())
        result = "\n\n".join(all_text)
        print(f"Total extracted text length: {len(result)}")
        return result
    except Exception as e:
        print(f"Error extracting text from PDF: {e}")
        return ""


def chunk_text(text: str, chunk_size=1000, overlap=50) -> List[str]:
    # Use character-based chunking for better performance
    chunks = []
    start = 0
    text_length = len(text)
    
    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunk = text[start:end]
        
        # Try to break at word boundary
        if end < text_length:
            last_space = chunk.rfind(' ')
            if last_space > chunk_size * 0.8:  # If we found a space in the last 20%
                chunk = chunk[:last_space]
                end = start + last_space
        
        chunks.append(chunk.strip())
        start = end - overlap if end < text_length else text_length
    
    return [chunk for chunk in chunks if chunk.strip()]  # Remove empty chunks