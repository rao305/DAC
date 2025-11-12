"""FastAPI application entry point."""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from config import get_settings
from app.database import init_db, close_db
from app.api import threads, router, providers, billing, audit, metrics
from app.middleware import ObservabilityMiddleware
from app.adapters._client import get_client

# OpenTelemetry instrumentation (Phase 4)
try:
    from app.services.otel_instrumentation import instrument_fastapi_app
    OTEL_ENABLED = True
except ImportError:
    OTEL_ENABLED = False
    print("Warning: OpenTelemetry not available (install opentelemetry packages)")

settings = get_settings()


async def warm_provider_connections():
    """Warm HTTP/2 connections to provider APIs on startup."""
    client = await get_client()
    
    # Warm connections to major providers (harmless health checks or no-ops)
    warm_urls = [
        "https://api.perplexity.ai",
        "https://api.openai.com",
        "https://generativelanguage.googleapis.com",
        "https://openrouter.ai",
    ]
    
    for url in warm_urls:
        try:
            # Quick HEAD request to establish connection
            await client.head(url, timeout=5.0)
        except Exception:
            # Ignore errors - this is just warming
            pass


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    # Startup
    await init_db()
    
    # Warm provider connections (HTTP/2 + TLS handshake)
    await warm_provider_connections()
    
    yield
    # Shutdown
    await close_db()


app = FastAPI(
    title="Cross-LLM Thread Hub",
    description="Multi-tenant B2B SaaS for cross-provider LLM threading",
    version="0.1.0",
    lifespan=lifespan
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url] if settings.is_production else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Observability middleware (Phase 1.5)
app.add_middleware(ObservabilityMiddleware)

# OpenTelemetry instrumentation (Phase 4)
if OTEL_ENABLED:
    app = instrument_fastapi_app(app)

# Include routers
app.include_router(threads.router, prefix="/api/threads", tags=["threads"])
app.include_router(router.router, prefix="/api/router", tags=["router"])
app.include_router(providers.router, prefix="/api/orgs", tags=["providers"])
app.include_router(billing.router, prefix="/api/billing", tags=["billing"])
app.include_router(audit.router, prefix="/api/audit", tags=["audit"])
app.include_router(metrics.router, prefix="/api", tags=["metrics"])


@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "ok", "service": "Cross-LLM Thread Hub"}


@app.get("/health")
async def health():
    """Health check with DB status."""
    # TODO: Add DB ping check
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
