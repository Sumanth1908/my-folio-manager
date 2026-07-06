"""
Celery application configuration.
"""
from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

# Explicitly import tasks to ensure registration
from app.tasks import automation  # noqa
from app.tasks import budgets  # noqa

# Create Celery app
celery_app = Celery(
    "my-folio-manager",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
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
    redbeat_redis_url=settings.CELERY_BROKER_URL,
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
    "budgets-copy-forward": {
        "task": "app.tasks.budgets.copy_forward_budgets_task",
        "schedule": crontab(minute=0, hour=1, day_of_month=1),  # 1 AM on the 1st of each month
    },
}

