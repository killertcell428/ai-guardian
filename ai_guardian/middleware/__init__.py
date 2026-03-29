"""Middleware integrations for ai-guardian.

Each integration requires its own optional dependency:

- FastAPI:    pip install 'aig-guardian[fastapi]'
- LangChain:  pip install 'aig-guardian[langchain]'
- OpenAI:     pip install 'aig-guardian[openai]'
- Anthropic:  pip install 'aig-guardian[anthropic]'
- LangGraph:  pip install 'aig-guardian[langchain]'  (uses langgraph package)

Quick import examples::

    from ai_guardian.middleware.fastapi import AIGuardianMiddleware
    from ai_guardian.middleware.langchain import AIGuardianCallback
    from ai_guardian.middleware.openai_proxy import SecureOpenAI
    from ai_guardian.middleware.anthropic_proxy import SecureAnthropic
    from ai_guardian.middleware.langgraph import GuardNode, GuardianBlockedError
"""
