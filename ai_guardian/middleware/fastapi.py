"""FastAPI middleware for ai-guardian.

Usage::

    from fastapi import FastAPI
    from ai_guardian import Guard
    from ai_guardian.middleware.fastapi import AIGuardianMiddleware

    app = FastAPI()
    guard = Guard()
    app.add_middleware(AIGuardianMiddleware, guard=guard)

The middleware intercepts ``/chat/completions``-style endpoints,
scans the request body, and returns a 400 JSON error if blocked.
All other paths pass through unchanged.
"""

from __future__ import annotations

import json
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from ai_guardian.guard import Guard

try:
    from starlette.middleware.base import BaseHTTPMiddleware
    from starlette.requests import Request
    from starlette.responses import JSONResponse, Response
except ImportError as e:
    raise ImportError(
        "FastAPI/Starlette is required for AIGuardianMiddleware. "
        "Install it with: pip install 'ai-guardian[fastapi]'"
    ) from e


class AIGuardianMiddleware(BaseHTTPMiddleware):
    """Starlette/FastAPI middleware that scans LLM request bodies.

    Intercepts any POST request whose body contains an OpenAI-style
    ``messages`` array. If the Guard blocks the request, returns HTTP 400
    with a structured error response before it reaches your route handler.

    Args:
        app: The ASGI application.
        guard: A configured :class:`~ai_guardian.Guard` instance.
        check_output: Also scan LLM responses if ``True``. Defaults to ``False``
                      because response scanning requires buffering the response
                      body and may add latency.
        paths: Optional list of path prefixes to scan. Defaults to all POST paths.
    """

    def __init__(
        self,
        app,
        guard: Guard,
        check_output: bool = False,
        paths: list[str] | None = None,
    ) -> None:
        super().__init__(app)
        self.guard = guard
        self.check_output = check_output
        self.paths = paths

    async def dispatch(self, request: Request, call_next) -> Response:
        if request.method == "POST" and self._should_scan(request.url.path):
            body_bytes = await request.body()
            try:
                body = json.loads(body_bytes)
            except (json.JSONDecodeError, ValueError):
                body = {}

            messages = body.get("messages")
            if messages:
                result = self.guard.check_messages(messages)
                if result.blocked:
                    return JSONResponse(
                        status_code=400,
                        content={
                            "error": {
                                "type": "guardian_policy_violation",
                                "code": "request_blocked",
                                "message": "Request blocked by AI Guardian security policy.",
                                "risk_score": result.risk_score,
                                "risk_level": result.risk_level.value,
                                "reasons": result.reasons,
                                "remediation": result.remediation,
                            }
                        },
                    )

        response = await call_next(request)
        return response

    def _should_scan(self, path: str) -> bool:
        if self.paths is None:
            return True
        return any(path.startswith(p) for p in self.paths)
