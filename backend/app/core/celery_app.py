"""
Celery application configuration.
"""
import os

from celery import Celery
from celery.schedules import crontab

# Explicitly import tasks to ensure registration
from app.tasks import automation  # noqa

# Create Celery app
celery_app = Celery(
    "my-folio-manager",
    broker=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    backend=os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0"),
)

# Celery configuration
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes max
    worker_prefetch_multiplier=1,
    redbeat_redis_url=os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    redbeat_key_prefix="redbeat",
)

# Auto-discover tasks in the tasks module
celery_app.autodiscover_tasks(["app.tasks"])

# Celery Beat schedule
celery_app.conf.beat_schedule = {
    "automation-rules-check": {
        "task": "app.tasks.automation.process_automation_rules",
        "schedule": crontab(minute="*/5"),  # Every 5 minutes
    },
}

