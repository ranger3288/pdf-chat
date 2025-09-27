# backend/app/main.py
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

from .api import app

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)