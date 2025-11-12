# Cross-LLM Thread Hub (MVP)

Multi-tenant B2B hub for cross-provider conversation threading (Perplexity, OpenAI Responses, Gemini), governed memory, and audit logs.

## Getting Started

1) `cp .env.example .env.local` and fill values

2) `docker compose up -d`  (Postgres + Qdrant)

3) Apply migrations in `apps/api/migrations`

> Enums are created idempotently; no manual `psql` step required.

4) `uvicorn apps.api.main:app --reload` (API)

5) `pnpm --filter @web dev` (Web)

## Packages

- `apps/api`: FastAPI, adapters, router, memory policies

- `apps/web`: Next.js App Router, settings/providers, threads UI

## 📚 Documentation

Comprehensive documentation is available in the [`/docs`](./docs/) directory:

- **[Documentation Home](./docs/README.md)** - Start here for an overview
- **[System Design](./docs/SYSTEM_DESIGN.md)** - Architecture and design (coming)
- **[Architecture](./docs/ARCHITECTURE.md)** - Technical details (coming)
- **[API Reference](./docs/API_REFERENCE.md)** - API documentation (coming)
- **[Quick Start Guide](./docs/QUICK_START_GUIDE.md)** - Get started quickly

For phase-specific documentation, see [`/docs/PHASES/`](./docs/PHASES/).
