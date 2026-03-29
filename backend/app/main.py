"""AI Guardian FastAPI application entry point."""
import asyncio
from contextlib import asynccontextmanager
from typing import AsyncGenerator

import structlog
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.routers.admin import router as admin_router
from app.routers.audit import router as audit_router
from app.routers.gandalf import router as gandalf_router
from app.routers.reports import router as reports_router
from app.routers.policies import router as policies_router
from app.routers.proxy import router as proxy_router
from app.routers.review import router as review_router

logger = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Application startup/shutdown lifecycle."""
    logger.info("AI Guardian starting up", version=settings.app_version)

    # Auto-seed demo data if DEMO_MODE is enabled
    if settings.demo_mode:
        try:
            from scripts.seed_demo import seed
            await seed()
        except Exception as exc:
            logger.warning("Demo seed skipped", error=str(exc))

    # Start background SLA watcher
    sla_task = asyncio.create_task(_sla_watcher())

    yield

    sla_task.cancel()
    try:
        await sla_task
    except asyncio.CancelledError:
        pass
    logger.info("AI Guardian shut down")


async def _sla_watcher() -> None:
    """Background task: periodically handle SLA timeouts."""
    from app.db.session import AsyncSessionLocal
    from app.review.service import handle_sla_timeouts

    while True:
        await asyncio.sleep(60)  # check every minute
        try:
            async with AsyncSessionLocal() as db:
                timed_out = await handle_sla_timeouts(db)
                await db.commit()
                if timed_out:
                    logger.warning(
                        "SLA timeouts processed", count=len(timed_out)
                    )
        except Exception as exc:
            logger.error("SLA watcher error", exc_info=exc)


app = FastAPI(
    title=settings.app_name,
    version=settings.app_version,
    description=(
        "AI Security Filter SaaS — OpenAI-compatible proxy with "
        "rule-based filtering, risk scoring, and Human-in-the-Loop review."
    ),
    lifespan=lifespan,
    docs_url="/docs" if settings.debug else None,
    redoc_url="/redoc" if settings.debug else None,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(proxy_router)
app.include_router(review_router)
app.include_router(policies_router)
app.include_router(audit_router)
app.include_router(admin_router)
app.include_router(gandalf_router)
app.include_router(reports_router)


@app.get("/health", tags=["health"])
async def health_check() -> JSONResponse:
    """Health check endpoint."""
    return JSONResponse({"status": "ok", "version": settings.app_version})
