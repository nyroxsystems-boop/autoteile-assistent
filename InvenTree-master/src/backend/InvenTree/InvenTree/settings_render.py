from .settings import *  # noqa

# Fix: collectstatic ignoriert oft Dot-Folder (z.B. ".vite") wenn ein ".*" Ignore aktiv ist.
# Wir setzen Ignore-Patterns explizit OHNE ".*", damit web/.vite/manifest.json mit eingesammelt wird.
STATICFILES_IGNORE_PATTERNS = [
    "CVS",
    "*~",
    "*.tmp",
    "*.temp",
]
