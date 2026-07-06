#!/usr/bin/env python3
"""
Development server startup script.
Run with: poetry run dev
"""
import uvicorn

def dev():
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )

if __name__ == "__main__":
    dev()
