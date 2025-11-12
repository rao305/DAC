---
title: DAC (Data Analysis Copilot) - Phase 1 Implemented Features
summary: Documentation file
last_updated: '2025-11-12'
owner: DAC
tags:
- dac
- docs
---

# DAC (Data Analysis Copilot) - Phase 1 Implemented Features

## Overview
The DAC application is a Multi-tenant B2B SaaS platform built on FastAPI (backend) and Next.js (frontend) that implements cross-provider LLM threading with intelligent routing, encryption, rate limiting, and observability.

---

# BACKEND FEATURES (FastAPI)

## 1. API Endpoints & Routes

### Thread Management API (`/api/threads`)
- **POST /api/threads/** - Create new thread
- **POST /api/threads/{thread_id}/messages** - Add message to thread (calls provider adapter)
- **GET /api/threads/{thread_id}** - Retrieve thread with all messages
- **GET /api/threads/{thread_id}/audit** - Get audit trail for thread (up to 25 entries)
- **POST /api/threads/{thread_id}/forward** - Forward thread to another provider (TODO: Phase 2)

### Provider Management API (`/api/orgs/{org_id}/providers`)
- **POST /api/orgs/{org_id}/providers** - Save/update encrypted provider API key (BYOK vault)
- **GET /api/orgs/{org_id}/providers/status** - Get masked provider status with usage metrics
- **POST /api/orgs/{org_id}/providers/test** - Test provider connection (health check)

### Routing API (`/api/router`)
- **POST /api/router/choose** - Rule-based provider selection based on message content

### Metrics API (`/api`)
- **GET /api/metrics** - System-wide metrics summary
- **GET /api/metrics/org/{org_id}** - Organization-specific metrics

### Billing API (`/api/billing`) - Phase 2 placeholders
- **POST /api/billing/checkout** - Create Stripe Checkout session (TODO)
- **POST /api/billing/webhooks** - Handle Stripe webhooks (TODO)
- **GET /api/billing/portal** - Get Stripe Customer Portal link (TODO)

### Audit API (`/api/audit`) - Phase 2 placeholders
- **GET /api/audit/threads/{thread_id}** - Get audit trail (TODO)

### Health Endpoints
- **GET /** - Root health check
- **GET /health** - Health check with DB status

## 2. Database Models & Schemas

### Core Models
- **Org** - Organization/tenant model
  - Multi-tenant isolation
  - Stripe billing integration (customer_id, subscription_id)
  - Rate limit overrides (requests_per_day, tokens_per_day)
  - SSO support (Phase 2 - sso_enabled, saml_metadata_url)

- **User** - User model
  - User roles (admin, member, viewer)
  - Organization membership
  - Email verification tracking
  - Last login timestamp

- **Thread** - Conversation thread model
  - Organization & creator association
  - Thread metadata (title, description)
  - Provider context tracking (last_provider, last_model)
  - Cascading deletion on org removal

- **Message** - Individual messages in threads
  - Sequence ordering within thread
  - Role enum (user, assistant, system)
  - Provider metadata (provider, model, provider_message_id)
  - Token usage tracking (prompt_tokens, completion_tokens, total_tokens)
  - Provider citations (for Perplexity)
  - Custom metadata (JSON - latency_ms, request_id)

- **ProviderKey** - Encrypted API key storage (BYOK)
  - Per-org, per-provider key management
  - Server-side encryption using Fernet
  - Key rotation support (is_active flag)
  - Last used timestamp
  - Friendly key names

- **MemoryFragment** - Vector embeddings with provenance
  - Tier system (private, shared)
  - Immutable audit trail (provenance JSON)
  - Content hashing for deduplication
  - Vector ID for Qdrant integration
  - Creator tracking

- **AuditLog** - Immutable audit trail
  - Routing decision logging (provider, model, reason)
  - Memory access tracking (fragments_included, fragments_excluded)
  - Scope tracking (auto, strict_private, allow_shared)
  - Package & response hashing for verification
  - Token usage per decision

- **UserAgentPermission** - Dynamic permission system
  - User → Agent/Provider access control
  - Temporal validity (granted_at, revoked_at)
  - Can_invoke flag

- **AgentResourcePermission** - Resource-level permissions
  - Agent → Resource access control
  - Temporal validity
  - Can_access flag

### Database Configuration
- PostgreSQL async engine with asyncpg
- Connection pooling (20 pool size, 0 max overflow)
- Alembic migrations (4 migration scripts)
- Row-Level Security (RLS) context setting
- Row-level security policies (20241109_rls_policies.py)

## 3. Authentication & Security

### Encryption Service
- Fernet-based symmetric encryption for API keys
- Key management via environment variable
- Encrypt/decrypt methods for BYOK vault

### RLS (Row-Level Security) Context
- Per-request org_id context setting
- Optional per-request user_id context
- PostgreSQL SET LOCAL app.current_org_id/app.current_user_id
- Enforced at database level

### API Security
- x-org-id header requirement (require_org_id dependency)
- 401 error on missing org header
- CORS configuration (dynamic based on environment)
- Production CORS restricted to frontend_url only

### Token Management
- JWT token support (HS256 algorithm)
- 30-minute default expiration
- python-jose with cryptography backend

## 4. LLM Provider Integrations

### Supported Providers
1. **Perplexity** - Web-grounded Q&A
   - Model: llama-3.1-sonar-small-128k-online
   - Citation support
   - Online search capability

2. **OpenAI** - Structured output & code
   - Model: gpt-4o-mini
   - Function calling support
   - Responses API compatible

3. **Gemini** - Long-context processing
   - Model: gemini-1.5-flash
   - Extended context window
   - Message format conversion (OpenAI → Gemini)

4. **OpenRouter** - Auto-routing & fallback
   - Model: auto (provider-selected)
   - Model aggregation
   - Fallback mechanism

### Provider Adapters (`app/adapters/`)
- **base.py** - ProviderResponse & ProviderAdapterError classes
- **openai_adapter.py** - OpenAI API integration
- **perplexity.py** - Perplexity API integration
- **gemini.py** - Gemini API integration with message conversion
- **openrouter.py** - OpenRouter API integration

### Provider Features
- Normalized response format (ProviderResponse dataclass)
- Automatic latency measurement
- Token usage tracking
- Error classification and handling
- 30-second timeout per request
- Temperature and max_tokens configuration

### Provider Dispatch Service
- Routes to correct adapter based on ProviderType enum
- Centralized provider calling logic

## 5. Core Services & Business Logic

### Provider Dispatch (`app/services/provider_dispatch.py`)
- Routes API calls to appropriate adapter
- Supports all 4 LLM providers

### Provider Key Management (`app/services/provider_keys.py`)
- Secure key retrieval and decryption
- Per-org key lookup
- Active key filtering

### Rate Limiting (`app/services/ratelimit.py`)
- Upstash Redis integration
- Per-org, per-provider rate limits
- Daily reset (midnight UTC)
- Request & token counting
- Granular limit enforcement (400+ requests, 100k+ tokens default)
- Fallback mode when Redis unavailable
- Rollback on limit violation

### Token Estimation (`app/services/token_estimator.py`)
- Characters/4 heuristic for text
- Message-level estimation
- Support for prompt + completion tokens

### Memory Guard (`app/services/memory_guard.py`)
- Qdrant vector database health checking
- 60-second cache for health checks
- Graceful degradation on Qdrant unavailability
- Async health endpoint monitoring

### Rule-Based Routing (`app/api/router.py`)
- 4 routing rules implemented:
  1. Web queries → Perplexity (search, latest, recent, news, current)
  2. Structured output → OpenAI (json, code, function, class, api, format, parse, extract)
  3. Long context → Gemini (>10 messages in thread)
  4. Questions → Perplexity (factual Q&A pattern detection)
  5. Default → OpenRouter (fallback)

### Observability & Metrics (`app/observability.py`)
- In-memory metrics collection
- Request counting by path, org, provider
- Error classification (provider_error, auth_error, validation_error, db_error, rate_limit_error, timeout_error, unknown_error)
- Latency tracking with percentiles (p50, p95, p99)
- Per-org metrics rollup
- Metrics middleware integration

### Middleware
- ObservabilityMiddleware - Request/response tracking
- Org_id extraction from URL path
- Error classification and recording
- Duration measurement (milliseconds)

## 6. Additional Backend Features

### Migrations (Alembic)
- **20241109_initial_schema.py** - Core tables and indexes
- **20241109_rls_policies.py** - PostgreSQL RLS security policies
- **20241110_add_message_meta.py** - Message metadata JSON column
- **20241110_idempotent_enums.py** - ENUM type idempotent creation

### Database Initialization
- Async engine creation with connection pooling
- Session management with AsyncSessionLocal
- Lifespan event handlers (startup/shutdown)
- Schema initialization via Alembic

### Configuration Management (`config.py`)
- Pydantic Settings with environment variable loading
- Database URL configuration
- Qdrant vector database settings
- Upstash Redis configuration
- Security configuration (encryption keys, algorithms)
- Email service configuration (SMTP, Resend)
- Stripe billing configuration
- Frontend URL configuration
- Environment detection (development/production)
- Fallback LLM provider keys (optional)

---

# FRONTEND FEATURES (Next.js)

## 1. Pages & Routes

### Public Pages
- **Home Page** (`/`) - Landing page with hero, features, pricing
- **Demo Page** (`/demo`) - Interactive chat interface demo
- **Login Page** (`/login`) - Authentication entry point (TODO)

### User Pages
- **Threads Page** (`/threads`) - Main chat interface for thread management
- **Provider Settings** (`/settings/providers`) - LLM provider key management

## 2. UI Components

### Core Components
- **Header** - Navigation with links to product, use cases, pricing, docs, sign-in, threads, settings
- **Hero** - Landing page hero section
- **Problem-Solution** - Problem/solution value prop section
- **Features** - Feature showcase section
- **How-It-Works** - Product walkthrough section
- **Use-Cases** - Use case examples
- **Pricing** - Pricing tiers and comparison
- **FAQ** - Frequently asked questions
- **Footer** - Footer with links and info
- **ChatInterface** - Reusable chat UI component
- **ThemeProvider** - Dark mode theme support

### UI Library Components (60 Radix UI components)
- Alert, Alert Dialog
- Avatar, Badge
- Button, Checkbox
- Card, Collapsible
- Context Menu, Dialog
- Dropdown Menu, Form
- Hover Card, Label
- Menubar, Navigation Menu
- Popover, Progress
- Radio Group, Scroll Area
- Select, Separator
- Sheet, Skeleton
- Slider, Switch
- Tabs, Toast
- Toggle, Toggle Group
- Tooltip
- Input, Textarea
- Combobox (cmdk)
- Data Table
- Date Picker
- Calendar
- Carousel
- Resizable Panels

## 3. Authentication Flow
- x-org-id header injection in all API calls
- Demo mode hardcoded org_id: 'org_demo'
- User-agent avatar (U for user)
- AI avatar (AI for assistant)

## 4. Main User Features

### Threads Page (`/app/threads/page.tsx`)
- Create new thread on first message
- Rule-based provider routing display
- Message history with provider badges
- Forward scope toggle (private/shared)
- Rate limit error handling (429 status)
- Copy message to clipboard functionality
- Optimistic message updates
- Auto-scroll to latest message
- Real-time typing indicator
- Error and limit alert display

### Provider Settings Page (`/app/settings/providers/page.tsx`)
- View all 4 providers (Perplexity, OpenAI, Gemini, OpenRouter)
- Add/update API keys with optional friendly names
- Save encrypted keys to backend
- Test provider connection health check
- Display masked keys (first 8 + last 4 characters)
- Per-provider usage metrics display
  - Requests today / limit
  - Tokens today / limit
- Memory subsystem health status
- Success/failure test result display
- Inline editing with save/cancel buttons
- Loading states and error handling

### Demo Page (`/app/demo/page.tsx`)
- Interactive chat interface for testing
- Getting started tips
- Key features showcase
- Pro tips sidebar

## 5. API Integration (`lib/api.ts`)
- ApiError class with status and body
- apiFetch helper function
- Automatic x-org-id header injection
- Configurable API base URL (NEXT_PUBLIC_API_URL)
- JSON error parsing with fallback
- Error detail extraction from response

## 6. UI/UX Features
- Dark mode support (html lang="en" className="dark")
- Responsive design (mobile, tablet, desktop)
- Tailwind CSS styling with custom animations
- Provider color coding (purple, green, blue, orange)
- Loader animations and spinners
- Badge indicators for status
- Card-based layouts
- Alert and error messaging
- Form validation
- Button disabled states during loading
- Smooth transitions and hover effects

---

# INFRASTRUCTURE & DEPLOYMENT

## 1. Docker Compose Setup (`docker-compose.yml`)

### Services
1. **PostgreSQL 15** (dac-postgres)
   - Port: 5432
   - Database: dac
   - Credentials: postgres/postgres
   - Health check enabled
   - Persistent volume: postgres_data

2. **Qdrant Vector Database** (dac-qdrant)
   - HTTP Port: 6333
   - gRPC Port: 6334
   - Health check via /healthz
   - Persistent volume: qdrant_data

3. **Redis 7** (dac-redis)
   - Port: 6379
   - Health check enabled
   - Persistent volume: redis_data

## 2. Environment Configuration (`.env.example`)

### Database
- DATABASE_URL (PostgreSQL async connection string)

### Vector Database (Qdrant)
- QDRANT_URL
- QDRANT_API_KEY

### Rate Limiting (Upstash Redis)
- UPSTASH_REDIS_URL
- UPSTASH_REDIS_TOKEN

### Security
- SECRET_KEY (JWT signing)
- ALGORITHM (HS256)
- ACCESS_TOKEN_EXPIRE_MINUTES (30)
- ENCRYPTION_KEY (Fernet for API keys)

### Email
- EMAIL_FROM
- SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD
- RESEND_API_KEY (optional)

### Stripe Billing
- STRIPE_SECRET_KEY
- STRIPE_PUBLISHABLE_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID

### Frontend
- FRONTEND_URL (http://localhost:3000)

### Application
- ENVIRONMENT (development/production)

### Rate Limits (Org Defaults)
- DEFAULT_REQUESTS_PER_DAY (1000)
- DEFAULT_TOKENS_PER_DAY (100000)

### LLM Provider Keys (Optional Fallback)
- PERPLEXITY_API_KEY
- OPENAI_API_KEY
- GOOGLE_API_KEY
- OPENROUTER_API_KEY

## 3. Dependencies

### Backend (Python)
- **Framework**: FastAPI 0.109.0, Uvicorn 0.27.0
- **Database**: SQLAlchemy 2.0.25, asyncpg 0.29.0, Alembic 1.13.1
- **Vector DB**: qdrant-client 1.7.3
- **Cache**: upstash-redis 0.15.0
- **Auth**: python-jose, passlib, cryptography
- **LLM**: openai 1.10.0, google-generativeai 0.3.2, httpx 0.26.0
- **Billing**: stripe 8.2.0
- **Config**: pydantic 2.5.3, pydantic-settings 2.1.0
- **Testing**: pytest 7.4.4, pytest-asyncio 0.23.4
- **Linting**: black 24.1.1, ruff 0.1.15

### Frontend (Node.js)
- **Framework**: Next.js 16.0.0, React 19.2.0
- **UI**: Radix UI, Tailwind CSS 4.1.9
- **Forms**: react-hook-form, zod
- **Icons**: lucide-react
- **Utilities**: date-fns, clsx, tailwind-merge
- **Charts**: recharts 2.15.4
- **Themes**: next-themes
- **TypeScript**: 5.x

## 4. API Server Configuration

### FastAPI App
- Title: "Cross-LLM Thread Hub"
- Version: "0.1.0"
- CORS middleware (origin varies by environment)
- ObservabilityMiddleware for metrics
- Lifespan events for DB initialization
- Router registration for all endpoints
- Health check endpoints

### Development Server
- Uvicorn with hot reload
- Host: 0.0.0.0, Port: 8000
- Debug/echo enabled in dev

## 5. Build Artifacts & Configuration
- **Tailwind CSS**: PostCSS integration, dark mode support
- **TypeScript**: Strict type checking
- **Next.js Config**: next.config.mjs
- **PostCSS Config**: postcss.config.mjs

---

# PHASE 1 EXIT CRITERIA VERIFICATION

## Implemented Features
✓ Multi-tenant architecture with org isolation
✓ 4 LLM providers integrated (Perplexity, OpenAI, Gemini, OpenRouter)
✓ Rule-based intelligent routing (5 rules)
✓ Thread-based conversation management
✓ Message sequencing and history
✓ BYOK (Bring Your Own Key) vault with encryption
✓ Per-org rate limiting (requests + tokens daily)
✓ Provider connection testing
✓ Usage metrics display
✓ Audit logging (routing decisions, memory access)
✓ Vector database health checking
✓ Request/response hashing for verification
✓ Memory fragments with provenance
✓ User role-based access control (admin, member, viewer)
✓ Row-Level Security database policies
✓ Observability and metrics collection
✓ Comprehensive error handling and classification
✓ Professional UI/UX with provider status dashboard
✓ Demo interface for testing
✓ Full API endpoint suite (threads, routing, providers, metrics)

## Not Yet Implemented (Phase 2+)
- Billing/Stripe webhook handling
- SSO/SAML authentication
- Advanced memory forwarding controls
- User authentication/login
- Streaming responses
- Advanced agent capabilities
- Document ingestion
- Custom agents

---

# FILE STRUCTURE SUMMARY

## Backend
```
backend/
├── app/
│   ├── adapters/          # LLM provider adapters (4 providers)
│   ├── api/               # API routes (threads, router, providers, billing, audit, metrics)
│   ├── models/            # SQLAlchemy ORM models (7 core models)
│   ├── services/          # Business logic (routing, rate limiting, memory, tokens)
│   ├── database.py        # DB configuration and sessions
│   ├── security.py        # Encryption and RLS
│   ├── middleware.py      # Observability middleware
│   ├── observability.py   # Metrics collection
│   └── __init__.py
├── migrations/            # Alembic migration scripts
├── main.py                # FastAPI app entry point
├── config.py              # Settings management
├── requirements.txt       # Python dependencies
└── seed_demo.py           # Demo data seeding
```

## Frontend
```
frontend/
├── app/
│   ├── demo/              # Demo page with chat
│   ├── threads/           # Main chat interface
│   ├── settings/providers/ # Provider settings page
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Home/landing page
│   └── globals.css        # Global styles
├── components/
│   ├── ui/                # 60+ Radix UI components
│   ├── header.tsx         # Navigation
│   ├── hero.tsx           # Hero section
│   ├── chat-interface.tsx # Chat UI
│   └── [others]           # Landing page sections
├── lib/
│   ├── api.ts             # API client utilities
│   └── utils.ts           # Utility functions
├── hooks/                 # Custom React hooks
├── public/                # Static assets
├── package.json           # Node dependencies
└── tailwind.config.js     # Tailwind configuration
```

---

# KEY STATISTICS

- **Database Models**: 9 (Org, User, Thread, Message, ProviderKey, MemoryFragment, AuditLog, UserAgentPermission, AgentResourcePermission)
- **API Endpoints**: 15+ implemented routes
- **LLM Providers**: 4 (Perplexity, OpenAI, Gemini, OpenRouter)
- **Routing Rules**: 5 content-based rules
- **UI Components**: 60+ Radix UI primitives
- **Custom Components**: 12+ landing page and app sections
- **Services**: 5 core business logic services
- **Database Migrations**: 4 migration scripts
- **Configuration Variables**: 25+ environment settings
- **Docker Services**: 3 (PostgreSQL, Qdrant, Redis)
- **Frontend Pages**: 5 (home, demo, threads, settings/providers, login placeholder)

