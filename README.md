# PDF Chat - Production-Ready RAG MVP

Document Q&A Assistant Built with Next.js, FastAPI, PostgreSQL + pgvector, and Google OAuth.

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
HUGGINGFACE_API_KEY=your-huggingface-api-key-here

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

## API Documentation

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

### Quick Start

Use the automated deployment script:

```bash
./deploy.sh
```

This will guide you through deploying to both Render and Vercel.

### Manual Deployment

#### Vercel (Frontend)

1. Go to [Vercel](https://vercel.com/) and sign up with GitHub
2. Click "New Project" and import your repository
3. Configure:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Set environment variables (see `ENVIRONMENT_VARIABLES.md`)
5. Deploy!

#### Render (Backend + Database)

1. Go to [Render](https://render.com/) and sign up with GitHub
2. Create a new Web Service:
   - **Name**: `pdf-chat-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: `3.11`
3. Add PostgreSQL database:
   - **Name**: `pdf-chat-db`
   - **Database**: `qnadb`
   - **User**: `pguser`
4. Set environment variables (see `ENVIRONMENT_VARIABLES.md`)
5. Deploy!

### Environment Variables

See `ENVIRONMENT_VARIABLES.md` for detailed configuration instructions.

### Post-Deployment

1. Update Google OAuth redirect URIs with your production URLs
2. Test the full application flow
3. Monitor logs for any issues
4. Set up monitoring and alerts

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
