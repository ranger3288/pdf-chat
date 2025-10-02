# backend/app/auth.py
import os
import httpx
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from .database import get_db, User

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

security = HTTPBearer()

def get_allowed_test_users() -> list[str]:
    """Get list of allowed test user emails from environment variable"""
    allowed_users = os.getenv("ALLOWED_TEST_USERS")
    if not allowed_users:
        print("WARNING: ALLOWED_TEST_USERS environment variable not set. No users will be allowed.")
        return []
    return [email.strip().lower() for email in allowed_users.split(",")]

def is_test_user(email: str) -> bool:
    """Check if the email belongs to an allowed test user"""
    allowed_users = get_allowed_test_users()
    if not allowed_users:
        return False
    return email.lower() in allowed_users

class GoogleAuth:
    def __init__(self):
        self.client_id = os.getenv("GOOGLE_CLIENT_ID")
        self.client_secret = os.getenv("GOOGLE_CLIENT_SECRET")
    
    async def verify_token(self, token: str) -> dict:
        """Verify Google OAuth token and return user info"""
        async with httpx.AsyncClient() as client:
            try:
                # Use the correct Google API endpoint
                response = await client.get(
                    "https://www.googleapis.com/oauth2/v2/userinfo",
                    headers={"Authorization": f"Bearer {token}"}
                )
                response.raise_for_status()
                return response.json()
            except httpx.HTTPError as e:
                print(f"Google token verification failed: {e}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid Google token"
                )

google_auth = GoogleAuth()

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user_id
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from Google token"""
    token = credentials.credentials
    
    try:
        google_user_info = await google_auth.verify_token(token)
        user_email = google_user_info["email"]
        
        # Check if user is an allowed test user
        if not is_test_user(user_email):
            print(f"Access denied for unauthorized user: {user_email}")
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access restricted to test users only"
            )
        
        user = db.query(User).filter(User.google_id == google_user_info["id"]).first()
        
        if not user:
            # Create new user (only if they're a test user)
            user = User(
                google_id=google_user_info["id"],
                email=google_user_info["email"],
                name=google_user_info.get("name"),
                picture=google_user_info.get("picture")
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        
        return user
    except HTTPException:
        # Re-raise HTTP exceptions (like our 403 Forbidden)
        raise
    except Exception as e:
        print(f"Authentication error: {e}")  # Debug logging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

def get_current_user_optional(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User | None:
    """Get current user if authenticated, otherwise return None"""
    try:
        return get_current_user(credentials, db)
    except HTTPException:
        return None
