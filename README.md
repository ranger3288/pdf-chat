# PDF Chat - Production-Ready RAG MVP

A production-ready PDF chat application with user authentication, document management, and AI-powered conversations. Built with Next.js, FastAPI, PostgreSQL + pgvector, and Google OAuth.

## 🚀 Features

- **User Authentication**: Google OAuth with NextAuth.js (JWT strategy)
- **Document Management**: Upload and manage PDF documents per user
- **AI Chat**: Interactive conversations with document context
- **Vector Search**: PostgreSQL + pgvector for semantic search
- **User Isolation**: All data is per-user with proper authorization
- **Production Ready**: Dockerized with health checks and proper error handling
- **Deployment Ready**: Vercel (frontend) + Render (backend + DB)

## 🏗️ Architecture

### Frontend (Next.js)
- **Pages Router**: Dashboard, document view, chat interface
- **NextAuth.js**: Google OAuth with JWT sessions
- **Proxy API Routes**: Secure communication with backend
- **Modern UI**: Clean, accessible interface with loading states

### Backend (FastAPI)
- **REST API**: Clean, typed endpoints with proper error handling
- **User Authentication**: Internal secret-based auth from Next.js
- **Vector Search**: pgvector for semantic similarity search
- **OpenAI Integration**: text-embedding-3-small + gpt-4o-mini

### Database (PostgreSQL + pgvector)
- **User Management**: Users, documents, chats, messages
- **Vector Storage**: 1536-dimensional embeddings
- **User Isolation**: All queries filtered by user ID

## 🛠️ Tech Stack

- **Frontend**: Next.js 15, TypeScript, NextAuth.js, Lucide React
- **Backend**: FastAPI, SQLAlchemy, pgvector, OpenAI
- **Database**: PostgreSQL with pgvector extension
- **Deployment**: Docker, Vercel, Render
- **Authentication**: Google OAuth, JWT sessions

## 📋 Prerequisites

- Node.js 20+
- Python 3.11+
- Docker & Docker Compose
- Google Cloud Console account
- OpenAI API key

## 🚀 Quick Start

### 1. Clone and Setup

```bash
git clone <repository-url>
cd pdf-chat
```

### 2. Environment Variables

Create `.env` file in the root directory:

```bash
# Database
DATABASE_URL=postgresql://pguser:pgpass@localhost:5432/qnadb

# OpenAI
OPENAI_API_KEY=your-openai-api-key-here

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id-here
GOOGLE_CLIENT_SECRET=your-google-client-secret-here

# Internal API Secret (for Next.js to Backend communication)
INTERNAL_API_SECRET=your-internal-secret-change-in-production

# Chat Model (optional, defaults to gpt-4o-mini)
CHAT_MODEL=gpt-4o-mini

# Backend URL (for frontend to backend communication)
BACKEND_URL=http://localhost:8000
```

### 3. Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.vercel.app/api/auth/callback/google` (production)

### 4. Run Locally

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Access the application
# Frontend: http://localhost:3000
# Backend: http://localhost:8000
# Database: localhost:5432
```

### 5. Development Mode

For development with hot reload:

```bash
# Terminal 1: Start database
docker-compose up -d db

# Terminal 2: Start backend
cd backend
pip install -r app/requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Terminal 3: Start frontend
cd frontend
npm install
npm run dev
```

## 📚 API Documentation

### Backend API (Base URL: `/api`)

#### Health Check
- `GET /api/healthz` - Health check endpoint

#### Document Management
- `POST /api/upload` - Upload PDF document (multipart/form-data)
- `GET /api/documents` - List user's documents
- `GET /api/documents/{id}/chats` - List chats for a document

#### Chat Management
- `POST /api/chats` - Create new chat
- `GET /api/chats/{id}/messages` - Get chat messages
- `POST /api/chats/{id}/ask` - Ask question in chat

### Frontend API Routes

- `POST /api/proxy-upload` - Proxy for document upload
- `GET /api/proxy-backend/*` - Proxy for all backend API calls

## 🗄️ Database Schema

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR UNIQUE NOT NULL,
    name VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    filename VARCHAR NOT NULL,
    original_filename VARCHAR NOT NULL,
    file_size INTEGER,
    upload_date TIMESTAMP DEFAULT NOW()
);

-- Document chunks with embeddings
CREATE TABLE document_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID REFERENCES documents(id),
    chunk_text TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    chunk_metadata TEXT,
    embedding VECTOR(1536)
);

-- Chat sessions
CREATE TABLE chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    document_id UUID REFERENCES documents(id),
    title VARCHAR,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat messages
CREATE TABLE chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES chat_sessions(id),
    role VARCHAR NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    timestamp TIMESTAMP DEFAULT NOW()
);
```

## 🚀 Deployment

### Vercel (Frontend)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Render (Backend + Database)

1. Create a new Web Service on Render
2. Connect your GitHub repository
3. Set build command: `pip install -r app/requirements.txt`
4. Set start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
5. Add PostgreSQL database (Managed)
6. Set environment variables

### Environment Variables for Production

```bash
# Database (Render will provide this)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# NextAuth
NEXTAUTH_URL=https://yourdomain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Internal API Secret
INTERNAL_API_SECRET=your-internal-secret

# Backend URL
BACKEND_URL=https://your-backend.onrender.com
```

## 🔧 Configuration

### Chunking Parameters
- **Chunk Size**: 800 tokens
- **Overlap**: 100 tokens
- **Embedding Model**: text-embedding-3-small (1536 dimensions)

### Search Parameters
- **Similarity Search**: Cosine distance
- **Top K**: 8 results retrieved, top 5 used
- **Chat Model**: gpt-4o-mini

### Security
- **CORS**: Configured for production
- **Internal Auth**: Shared secret between frontend and backend
- **User Isolation**: All queries filtered by user ID

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection**: Ensure PostgreSQL is running and accessible
2. **Google OAuth**: Check redirect URIs and client credentials
3. **OpenAI API**: Verify API key and rate limits
4. **CORS Issues**: Check backend CORS configuration

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db
```

## 📝 License

MIT License - see LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing issues
3. Create a new issue with detailed information