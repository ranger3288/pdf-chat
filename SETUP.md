# Local Development Setup

This guide will help you set up the PDF Chat application for local development.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js 20+**: [Download here](https://nodejs.org/)
- **Python 3.11+**: [Download here](https://www.python.org/downloads/)
- **Docker & Docker Compose**: [Download here](https://www.docker.com/products/docker-desktop/)
- **Git**: [Download here](https://git-scm.com/)

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd pdf-chat
```

### 2. Environment Setup

Create a `.env` file in the root directory:

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

#### 3.1 Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the Google+ API

#### 3.2 Create OAuth Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth 2.0 Client IDs"
3. Configure the OAuth consent screen if prompted
4. Set application type to "Web application"
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`

#### 3.3 Get Credentials
1. Copy the Client ID and Client Secret
2. Add them to your `.env` file

### 4. OpenAI API Setup

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or sign in
3. Go to "API Keys" section
4. Create a new API key
5. Add it to your `.env` file

### 5. Run the Application

#### Option A: Docker Compose (Recommended)

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop services
docker-compose down
```

#### Option B: Development Mode

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

### 6. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Database**: localhost:5432

## 🔧 Development Workflow

### Backend Development

```bash
cd backend

# Install dependencies
pip install -r app/requirements.txt

# Run with auto-reload
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Run tests (if available)
pytest

# Check code formatting
black app/
isort app/
```

### Frontend Development

```bash
cd frontend

# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run type-check
```

### Database Management

```bash
# Connect to database
docker-compose exec db psql -U pguser -d qnadb

# View tables
\dt

# View data
SELECT * FROM users LIMIT 5;

# Exit
\q
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Database Connection Issues
```bash
# Check if database is running
docker-compose ps

# Restart database
docker-compose restart db

# Check database logs
docker-compose logs db
```

#### 2. Backend Won't Start
```bash
# Check Python version
python --version

# Install dependencies
pip install -r backend/app/requirements.txt

# Check environment variables
echo $DATABASE_URL
echo $OPENAI_API_KEY
```

#### 3. Frontend Build Issues
```bash
# Clear node_modules and reinstall
rm -rf frontend/node_modules
cd frontend
npm install

# Check Node.js version
node --version

# Clear Next.js cache
rm -rf frontend/.next
```

#### 4. Google OAuth Issues
- Verify redirect URIs match exactly
- Check client ID and secret
- Ensure OAuth consent screen is configured
- Check browser console for errors

#### 5. OpenAI API Issues
- Verify API key is correct
- Check API usage limits
- Ensure you have credits in your account

### Debug Commands

```bash
# Check all services
docker-compose ps

# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Restart specific service
docker-compose restart backend

# Rebuild and restart
docker-compose up --build -d
```

### Environment Variable Issues

```bash
# Check if .env file exists
ls -la .env

# Check environment variables
cat .env

# Test database connection
docker-compose exec backend python -c "
import os
from sqlalchemy import create_engine
engine = create_engine(os.getenv('DATABASE_URL'))
print('Database connection successful!')
"
```

## 📁 Project Structure

```
pdf-chat/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── api.py              # FastAPI routes
│   │   ├── auth.py             # Authentication logic
│   │   ├── database.py         # Database models
│   │   ├── embeddings.py       # OpenAI embeddings
│   │   ├── main.py             # FastAPI app
│   │   ├── openai_client.py    # OpenAI client
│   │   ├── pdf_parser.py       # PDF processing
│   │   ├── requirements.txt    # Python dependencies
│   │   └── vector_store.py     # Vector operations
│   └── Dockerfile
├── frontend/
│   ├── pages/
│   │   ├── api/
│   │   │   ├── auth/
│   │   │   │   └── [...nextauth].ts
│   │   │   ├── proxy-backend/
│   │   │   │   └── [...path].ts
│   │   │   └── proxy-upload.ts
│   │   ├── chat/
│   │   │   └── [id].tsx
│   │   ├── doc/
│   │   │   └── [id].tsx
│   │   ├── dashboard.tsx
│   │   ├── index.tsx
│   │   └── _app.tsx
│   ├── types/
│   │   └── next-auth.d.ts
│   ├── package.json
│   ├── next.config.js
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
├── README.md
├── DEPLOYMENT.md
└── SETUP.md
```

## 🧪 Testing

### Backend Testing
```bash
cd backend
python -m pytest tests/
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
```bash
# Start all services
docker-compose up -d

# Test API endpoints
curl http://localhost:8000/api/healthz

# Test frontend
open http://localhost:3000
```

## 📚 Additional Resources

- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Next.js Documentation](https://nextjs.org/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [OpenAI API Documentation](https://platform.openai.com/docs)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Test your changes
5. Commit your changes: `git commit -m 'Add amazing feature'`
6. Push to the branch: `git push origin feature/amazing-feature`
7. Open a Pull Request

## 📞 Support

If you encounter any issues:

1. Check this setup guide
2. Check the troubleshooting section
3. Search existing issues on GitHub
4. Create a new issue with detailed information

Happy coding! 🚀