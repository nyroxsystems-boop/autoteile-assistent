import os

from .settings import *  # noqa


def _env_bool(name: str, default: bool = False) -> bool:
    """Parse boolean-ish env vars safely."""
    raw = os.environ.get(name)
    if raw is None:
        return default
    return str(raw).strip().lower() in {'1', 'true', 'yes', 'on'}


# Admin toggle: default False for Render, can be enabled via ENV
INVENTREE_ADMIN_ENABLED = _env_bool('INVENTREE_ADMIN_ENABLED', default=False)

# Admin URL: allow override via ENV, sanitize trailing slashes
_admin_env = os.environ.get('INVENTREE_ADMIN_URL')
if _admin_env:
    INVENTREE_ADMIN_URL = _admin_env.strip('/') or 'admin'
else:
    INVENTREE_ADMIN_URL = (locals().get('INVENTREE_ADMIN_URL') or 'admin').strip('/')  # type: ignore

# CORS override for Render (frontend on autoteile-dashboard.onrender.com)
_cors_origins = [
    'https://autoteile-dashboard.onrender.com',
    'https://wawi-new.onrender.com',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
]

try:
    CORS_ALLOWED_ORIGINS = list(set(CORS_ALLOWED_ORIGINS + _cors_origins))  # type: ignore
except Exception:
    CORS_ALLOWED_ORIGINS = _cors_origins

# CSRF configuration for Render deployment
CSRF_TRUSTED_ORIGINS = [
    'https://autoteile-dashboard.onrender.com',
    'https://wawi-new.onrender.com',
    'http://localhost:5173',
    'http://localhost:4173',
    'http://127.0.0.1:5173',
]

CORS_ALLOW_HEADERS = [
    'authorization',
    'content-type',
    'accept',
    'origin',
    'cache-control',
    'pragma',
    'expires',
    'x-requested-with',
    'x-csrftoken',
]

CORS_ALLOW_METHODS = [
    'GET',
    'POST',
    'PUT',
    'PATCH',
    'DELETE',
    'OPTIONS',
]

# CORS credentials and preflight settings
CORS_ALLOW_CREDENTIALS = True
CORS_ALLOW_ALL_ORIGINS = False

# Fix: collectstatic ignoriert oft Dot-Folder (z.B. ".vite") wenn ein ".*" Ignore aktiv ist.
# Wir setzen Ignore-Patterns explizit OHNE ".*", damit web/.vite/manifest.json mit eingesammelt wird.
STATICFILES_IGNORE_PATTERNS = [
    "CVS",
    "*~",
    "*.tmp",
    "*.temp",
]
