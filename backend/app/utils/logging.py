from __future__ import annotations

import logging
from typing import Optional


def get_logger(name: Optional[str] = None) -> logging.Logger:
    """Return a module-level logger."""
    return logging.getLogger(name or __name__)
