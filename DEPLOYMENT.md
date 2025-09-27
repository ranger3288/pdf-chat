# Deployment Guide

This guide covers deploying the PDF Chat application to production using Vercel (frontend) and Render (backend + database).

## 🎯 Overview

- **Frontend**: Vercel (Next.js)
- **Backend**: Render (FastAPI)
- **Database**: Render PostgreSQL (with pgvector)

## 🚀 Step-by-Step Deployment

### 1. Prepare Your Repository

Ensure your code is pushed to GitHub with all the latest changes:

```bash
git add .
git commit -m "feat: production-ready PDF chat MVP"
git push origin main
```

### 2. Deploy Backend to Render

#### 2.1 Create Render Account
1. Go to [Render](https://render.com/)
2. Sign up with GitHub
3. Connect your repository

#### 2.2 Create Web Service
1. Click "New +" → "Web Service"
2. Connect your GitHub repository
3. Configure the service:
   - **Name**: `pdf-chat-backend`
   - **Root Directory**: `backend`
   - **Build Command**: `pip install -r app/requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Python Version**: `3.11`

#### 2.3 Add PostgreSQL Database
1. Click "New +" → "PostgreSQL"
2. Configure:
   - **Name**: `pdf-chat-db`
   - **Database**: `qnadb`
   - **User**: `pguser`
   - **Region**: Choose closest to your users

#### 2.4 Configure Environment Variables
In your Render web service, add these environment variables:

```bash
# Database (Render will provide this)
DATABASE_URL=postgresql://user:pass@host:port/dbname

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Internal API Secret
INTERNAL_API_SECRET=your-secure-random-secret-here

# Chat Model (optional)
CHAT_MODEL=gpt-4o-mini
```

#### 2.5 Deploy Backend
1. Click "Create Web Service"
2. Wait for deployment to complete
3. Note the service URL (e.g., `https://pdf-chat-backend.onrender.com`)

### 3. Deploy Frontend to Vercel

#### 3.1 Create Vercel Account
1. Go to [Vercel](https://vercel.com/)
2. Sign up with GitHub
3. Import your repository

#### 3.2 Configure Project
1. **Framework Preset**: Next.js
2. **Root Directory**: `frontend`
3. **Build Command**: `npm run build`
4. **Output Directory**: `.next`

#### 3.3 Set Environment Variables
In Vercel dashboard, add these environment variables:

```bash
# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Backend URL
BACKEND_URL=https://pdf-chat-backend.onrender.com

# Internal API Secret (same as backend)
INTERNAL_API_SECRET=your-secure-random-secret-here
```

#### 3.4 Deploy Frontend
1. Click "Deploy"
2. Wait for deployment to complete
3. Note the domain (e.g., `https://pdf-chat.vercel.app`)

### 4. Configure Google OAuth

#### 4.1 Update Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to APIs & Services → Credentials
3. Edit your OAuth 2.0 client
4. Add authorized redirect URIs:
   - `https://your-domain.vercel.app/api/auth/callback/google`

#### 4.2 Update Vercel Environment
Update the `NEXTAUTH_URL` in Vercel to match your actual domain.

### 5. Test the Deployment

#### 5.1 Test Backend
```bash
curl https://pdf-chat-backend.onrender.com/api/healthz
# Should return: {"ok": true}
```

#### 5.2 Test Frontend
1. Visit your Vercel domain
2. Try signing in with Google
3. Upload a test PDF
4. Create a chat and ask questions

### 6. Monitor and Maintain

#### 6.1 Render Monitoring
- Check service logs in Render dashboard
- Monitor database usage
- Set up alerts for downtime

#### 6.2 Vercel Monitoring
- Check function logs in Vercel dashboard
- Monitor build logs
- Set up error tracking

## 🔧 Production Optimizations

### Backend Optimizations
1. **Database Connection Pooling**: Already configured in SQLAlchemy
2. **Caching**: Consider Redis for frequently accessed data
3. **Rate Limiting**: Add rate limiting for API endpoints
4. **Monitoring**: Add application monitoring (e.g., Sentry)

### Frontend Optimizations
1. **CDN**: Vercel provides global CDN
2. **Image Optimization**: Next.js automatic image optimization
3. **Bundle Analysis**: Use `@next/bundle-analyzer`
4. **Error Tracking**: Add error tracking (e.g., Sentry)

### Database Optimizations
1. **Indexing**: Ensure proper indexes on frequently queried columns
2. **Connection Limits**: Monitor connection usage
3. **Backup**: Set up automated backups
4. **Scaling**: Consider read replicas for high traffic

## 🚨 Troubleshooting

### Common Issues

#### Backend Won't Start
- Check environment variables
- Verify database connection
- Check build logs for errors

#### Frontend Build Fails
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for TypeScript errors

#### Database Connection Issues
- Verify DATABASE_URL format
- Check if database is accessible
- Ensure pgvector extension is enabled

#### Google OAuth Issues
- Verify redirect URIs match exactly
- Check client ID and secret
- Ensure OAuth consent screen is configured

### Debug Commands

```bash
# Check backend logs
curl -v https://pdf-chat-backend.onrender.com/api/healthz

# Test database connection
psql $DATABASE_URL -c "SELECT version();"

# Check frontend build locally
cd frontend
npm run build
```

## 📊 Monitoring Setup

### 1. Application Monitoring
- **Sentry**: Error tracking and performance monitoring
- **LogRocket**: User session recording
- **Uptime Robot**: Uptime monitoring

### 2. Database Monitoring
- **Render Dashboard**: Built-in database metrics
- **pgAdmin**: Database administration
- **Custom Queries**: Monitor query performance

### 3. Performance Monitoring
- **Vercel Analytics**: Frontend performance
- **Render Metrics**: Backend performance
- **Google Analytics**: User behavior

## 🔒 Security Checklist

- [ ] Environment variables are secure
- [ ] CORS is properly configured
- [ ] Internal API secret is strong
- [ ] Google OAuth is properly configured
- [ ] Database access is restricted
- [ ] HTTPS is enabled everywhere
- [ ] Error messages don't leak sensitive info

## 📈 Scaling Considerations

### Horizontal Scaling
- **Frontend**: Vercel handles this automatically
- **Backend**: Render supports auto-scaling
- **Database**: Consider read replicas

### Vertical Scaling
- **Backend**: Upgrade Render plan for more resources
- **Database**: Upgrade PostgreSQL plan for more storage/connections

### Cost Optimization
- **Render**: Use free tier for development, paid for production
- **Vercel**: Free tier for personal projects, Pro for business
- **OpenAI**: Monitor API usage and costs

## 🎉 Success!

Your PDF Chat application is now deployed and ready for production use! Users can:

1. Sign in with Google
2. Upload PDF documents
3. Create chat sessions
4. Ask questions about their documents
5. View conversation history

Monitor your application and scale as needed based on usage patterns.