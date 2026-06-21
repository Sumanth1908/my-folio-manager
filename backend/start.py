#!/usr/bin/env python3
"""
Production server startup script.
Run with: poetry run start
"""
import uvicorn

def start():
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        log_level="warning"
    )

if __name__ == "__main__":
    start()
