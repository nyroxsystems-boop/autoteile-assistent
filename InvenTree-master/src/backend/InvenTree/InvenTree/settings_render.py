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

# Fix: collectstatic ignoriert oft Dot-Folder (z.B. ".vite") wenn ein ".*" Ignore aktiv ist.
# Wir setzen Ignore-Patterns explizit OHNE ".*", damit web/.vite/manifest.json mit eingesammelt wird.
STATICFILES_IGNORE_PATTERNS = [
    "CVS",
    "*~",
    "*.tmp",
    "*.temp",
]
