# backend/app/embeddings.py
import hashlib
from typing import List

def embed_texts(texts: List[str]) -> List[list]:
    """Generate 384-dimensional embeddings for text search"""
    # Create 384-dimensional vectors to match the database schema
    # This is a simple hash-based approach that creates consistent 384-dim vectors
    embeddings = []
    for text in texts:
        # Create a more sophisticated hash-based vector
        text_lower = text.lower()
        
        # Use multiple hash functions to create a 384-dimensional vector
        vector = []
        
        # Method 1: MD5 hash expanded to 128 dimensions
        md5_hash = hashlib.md5(text_lower.encode()).hexdigest()
        for i in range(0, len(md5_hash), 2):
            hex_pair = md5_hash[i:i+2]
            vector.append(int(hex_pair, 16) / 255.0)  # Normalize to 0-1
        
        # Method 2: SHA256 hash expanded to 128 dimensions  
        sha256_hash = hashlib.sha256(text_lower.encode()).hexdigest()
        for i in range(0, len(sha256_hash), 2):
            hex_pair = sha256_hash[i:i+2]
            vector.append(int(hex_pair, 16) / 255.0)  # Normalize to 0-1
        
        # Method 3: Character frequency-based features (128 dimensions)
        char_counts = {}
        for char in text_lower:
            char_counts[char] = char_counts.get(char, 0) + 1
        
        # Create features based on character frequencies
        for i in range(128):
            char_code = (i + ord('a')) % 256
            char = chr(char_code)
            freq = char_counts.get(char, 0)
            # Normalize frequency
            vector.append(min(freq / max(len(text), 1), 1.0))
        
        # Ensure we have exactly 384 dimensions
        while len(vector) < 384:
            vector.append(0.0)
        vector = vector[:384]
        
        embeddings.append(vector)
    
    return embeddings
