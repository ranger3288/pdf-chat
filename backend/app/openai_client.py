# backend/app/openai_client.py
import os
from openai import OpenAI

_ALLOWED_KWARGS = {"api_key", "base_url", "organization", "project", "timeout", "max_retries", "default_headers"}

def _clean_kwargs(kwargs: dict) -> dict:
    # Strip any unexpected keys like "proxies" that may sneak in from config
    return {k: v for k, v in (kwargs or {}).items() if k in _ALLOWED_KWARGS and v is not None}

def get_openai_client(**maybe_config):
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        raise RuntimeError("OPENAI_API_KEY not set")
    cfg = _clean_kwargs(maybe_config)
    # DO NOT pass a "proxies" kwarg here; use HTTP(S)_PROXY env vars instead if needed
    return OpenAI(api_key=api_key, **cfg)
