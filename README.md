# DAC - Distributed AI Coordinator

**Enterprise-grade intelligent LLM routing platform that operates across multiple providers with unified context, intelligent routing, and enterprise security.**

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue.svg)](https://www.python.org/)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)

---

## 🎯 Overview

DAC (Distributed AI Coordinator) is a unified AI assistant platform that intelligently routes queries across multiple LLM providers (OpenAI, Anthropic, Google Gemini, Perplexity, Kimi) while maintaining a single, consistent conversation context. Users interact with one assistant—DAC—while the system automatically selects the optimal provider based on query intent, cost, and performance.

### Key Features

- **🤖 Unified AI Assistant** - Single persona across all providers
- **🧠 Intelligent Routing** - Intent-based provider selection
- **💬 Context Continuity** - Seamless context across provider switches
- **🔒 Enterprise Security** - Encrypted API keys, multi-tenant isolation
- **📊 Observability** - Real-time metrics, cost tracking, performance analytics
- **⚡ High Performance** - Sub-200ms p95 TTFT, 99.9% uptime
- **🎨 Modern UI** - Enterprise-grade B2B interface with motion and polish

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Next.js)                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Conversations│  │   Settings   │  │   Analytics  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API (FastAPI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │   Router     │  │   Memory     │  │  Adapters    │     │
│  │  (Intent)    │  │  (Qdrant)    │  │ (Providers)  │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
         │              │              │              │
         ▼              ▼              ▼              ▼
    ┌────────┐    ┌────────┐    ┌────────┐    ┌────────┐
    │ OpenAI │    │Anthropic│   │ Gemini │    │Perplexity│
    └────────┘    └────────┘    └────────┘    └────────┘
```

### Core System Techniques

#### 1. **Intelligent Routing**
- **Intent Detection**: Analyzes query content to determine intent (social_chat, qa_retrieval, coding_help, editing/writing, reasoning/math)
- **Cost Optimization**: Routes to cheapest capable model (Gemini Flash for simple, GPT-4o-mini for reasoning, Perplexity for web search)
- **Performance-Based**: Monitors latency and automatically falls back to faster providers
- **Context-Aware**: Considers conversation length and complexity

#### 2. **Unified Persona System**
- **DAC Identity**: All responses presented as "DAC" regardless of underlying provider
- **Consistent Tone**: Single voice across all models (friendly, concise, helpful)
- **Response Sanitization**: Automatically removes provider self-references
- **Thinking Preamble**: Structured thinking/searching display for UI animation

#### 3. **Memory & Context Management**
- **Vector Memory**: Qdrant-based semantic memory for cross-conversation context
- **Coalescing**: Deduplicates concurrent requests to same query
- **Context Window Management**: Smart truncation for long conversations
- **Memory Retrieval**: Retrieves relevant past context based on query similarity

#### 4. **Multi-Tenant Architecture**
- **Organization Isolation**: Row-Level Security (RLS) at database level
- **Encrypted API Keys**: Fernet encryption for provider API keys
- **Per-Org Rate Limits**: Configurable limits per organization
- **Audit Logging**: Complete audit trail of all operations

#### 5. **Performance Optimization**
- **Streaming Responses**: Server-Sent Events (SSE) for real-time streaming
- **Request Coalescing**: Prevents duplicate API calls
- **Caching**: Redis-based caching for frequent queries
- **Connection Pooling**: Efficient database and HTTP connection management

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.9+**
- **Node.js 18+**
- **Docker & Docker Compose**
- **PostgreSQL 15+** (via Docker)
- **Qdrant** (via Docker)
- **Redis** (via Docker)

### 1. Clone Repository

```bash
git clone https://github.com/your-org/dac.git
cd dac
```

### 2. Start Infrastructure Services

```bash
# Start PostgreSQL, Qdrant, and Redis
docker compose up -d

# Verify services are running
docker compose ps
```

### 3. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env

# Edit .env with your configuration
# Required: DATABASE_URL, QDRANT_URL, REDIS_URL, SECRET_KEY, ENCRYPTION_KEY
```

**Generate Keys:**
```bash
# Generate SECRET_KEY
openssl rand -hex 32

# Generate ENCRYPTION_KEY
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

**Run Migrations:**
```bash
# Apply database migrations
alembic upgrade head
```

**Start Backend:**
```bash
# Development mode
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Or use the startup script
python main.py
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp .env.example .env.local

# Edit .env.local
# Required: NEXT_PUBLIC_API_URL=http://localhost:8000

# Start development server
npm run dev
```

### 5. Access Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Qdrant Dashboard**: http://localhost:6333/dashboard

---

## 📋 Detailed Setup

### Environment Variables

#### Backend (`backend/.env`)

```env
# Database
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/dac

# Vector Database
QDRANT_URL=http://localhost:6333
QDRANT_API_KEY=

# Redis
REDIS_URL=redis://localhost:6379

# Security
SECRET_KEY=your-secret-key-here
ENCRYPTION_KEY=your-encryption-key-here

# CORS
CORS_ORIGINS=http://localhost:3000

# Optional: Provider API Keys (can be set per-org via API)
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GOOGLE_API_KEY=
PERPLEXITY_API_KEY=
```

#### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000
```

### Database Setup

```bash
cd backend

# Create database (if not using Docker)
createdb dac

# Run migrations
alembic upgrade head

# Verify tables
psql -d dac -c "\dt"
```

### Provider API Keys

API keys can be configured in two ways:

1. **Per-Organization** (Recommended): Via API or UI settings
2. **Global Default**: Set in `backend/.env` (fallback)

```bash
# Add API key for an organization
curl -X POST http://localhost:8000/api/orgs/{org_id}/provider-keys \
  -H "Content-Type: application/json" \
  -H "x-org-id: {org_id}" \
  -d '{
    "provider": "openai",
    "api_key": "sk-...",
    "is_active": true
  }'
```

---

## 🛠️ Tech Stack

### Backend
- **FastAPI** - Modern async Python web framework
- **PostgreSQL** - Primary database with RLS
- **SQLAlchemy** - Async ORM
- **Alembic** - Database migrations
- **Qdrant** - Vector database for semantic memory
- **Redis/Upstash** - Caching and rate limiting
- **Pydantic** - Data validation
- **Cryptography** - API key encryption

### Frontend
- **Next.js 16** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS 4** - Utility-first CSS
- **Framer Motion** - Animation library
- **Radix UI** - Accessible component primitives
- **Recharts** - Data visualization
- **shadcn/ui** - Component library

### Infrastructure
- **Docker Compose** - Local development environment
- **PostgreSQL 15** - Relational database
- **Qdrant** - Vector search engine
- **Redis 7** - In-memory data store

---

## 🎨 System Techniques

### Intelligent Routing Algorithm

```python
# Routing logic prioritizes:
1. Intent detection (web search, coding, reasoning, etc.)
2. Cost optimization (cheapest capable model)
3. Performance (latency monitoring)
4. Context length (long conversations → Gemini)
5. Fallback chain (primary → backup → default)
```

### Memory Coalescing

- **Deduplication**: Concurrent identical requests share single API call
- **Key Generation**: Based on provider, model, messages, thread
- **TTL**: 5-second window for coalescing
- **Leader-Follower**: One request executes, others wait and share result

### Context Management

- **Rolling Memory**: Last N turns + summary + profile facts
- **Smart Truncation**: Preserves system messages and recent context
- **Cross-Provider Context**: Memory persists across provider switches
- **Semantic Retrieval**: Vector search for relevant past context

### Response Streaming

- **Server-Sent Events**: Real-time streaming via SSE
- **Thinking Preamble**: Structured thinking/searching display
- **Chunk Processing**: Character-by-character or token-by-token
- **Error Handling**: Graceful fallback on stream errors

---

## 📚 API Endpoints

### Core Endpoints

```
POST   /api/threads                    # Create thread
GET    /api/threads/{id}               # Get thread
POST   /api/threads/{id}/messages      # Send message (non-streaming)
POST   /api/threads/{id}/messages/stream  # Send message (streaming)
GET    /api/threads/{id}/messages      # Get message history
```

### Provider Management

```
POST   /api/orgs/{org_id}/provider-keys    # Add API key
GET    /api/orgs/{org_id}/provider-keys     # List keys
PUT    /api/orgs/{org_id}/provider-keys/{id}  # Update key
DELETE /api/orgs/{org_id}/provider-keys/{id}  # Delete key
```

### Full API Documentation

Visit http://localhost:8000/docs for interactive API documentation.

---

## 🔧 Development

### Running Tests

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

### Code Quality

```bash
# Backend linting
cd backend
black .
ruff check .

# Frontend linting
cd frontend
npm run lint
```

### Database Migrations

```bash
cd backend

# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback
alembic downgrade -1
```

---

## 📖 Documentation

Comprehensive documentation is available in the [`/docs`](./docs/) directory:

- **[System Design](./docs/SYSTEM_DESIGN.md)** - Architecture overview
- **[Intelligent Routing Guide](./docs/INTELLIGENT_ROUTING_GUIDE.md)** - How routing works
- **[Provider Switching Guide](./docs/PROVIDER_SWITCHING_GUIDE.md)** - Switching providers
- **[Quick Start Guide](./QUICK_START_GUIDE.md)** - Get started quickly
- **[API Reference](./docs/API_REFERENCE.md)** - API documentation

---

## 🚢 Deployment

### Production Checklist

- [ ] Set secure `SECRET_KEY` and `ENCRYPTION_KEY`
- [ ] Configure production database (PostgreSQL)
- [ ] Set up Qdrant cluster
- [ ] Configure Redis/Upstash
- [ ] Set CORS origins
- [ ] Enable HTTPS
- [ ] Configure rate limits
- [ ] Set up monitoring (Grafana, Prometheus)
- [ ] Configure logging
- [ ] Set up backup strategy

### Docker Production

```bash
# Build images
docker build -t dac-backend ./backend
docker build -t dac-frontend ./frontend

# Run with docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🆘 Support

- **Documentation**: See [`/docs`](./docs/) directory
- **Issues**: [GitHub Issues](https://github.com/your-org/dac/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/dac/discussions)

---

## 🎯 Roadmap

- [x] Phase 1: Multi-provider routing
- [x] Phase 2: Memory & context management
- [x] Phase 3: Unified persona
- [x] Phase 4: Enterprise features
- [ ] Phase 5: Advanced analytics & optimization

---

**Built with ❤️ by the DAC Team**
