import subprocess
import sys

def start_worker():
    """Start Celery worker."""
    print("Starting Celery worker...")
    subprocess.run(["celery", "-A", "app.core.celery_app:celery_app", "worker", "--loglevel=info"])

def start_beat():
    """Start Celery beat."""
    print("Starting Celery beat...")
    subprocess.run(["celery", "-A", "app.core.celery_app:celery_app", "beat", "--loglevel=info"])

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "beat":
        start_beat()
    else:
        start_worker()
