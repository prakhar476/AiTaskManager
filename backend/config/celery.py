"""
Celery configuration for AI Task Manager.
Handles async NLP processing, scheduled tasks, and background jobs.
"""

import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('ai_task_manager')

# Load config from Django settings, namespace='CELERY'
app.config_from_object('django.conf:settings', namespace='CELERY')

# Auto-discover tasks in all installed apps
app.autodiscover_tasks()

# ── Scheduled tasks (Celery Beat) ─────────────────────────────────────────────
app.conf.beat_schedule = {
    # Re-process any tasks that missed NLP — runs every 30 minutes
    'batch-process-unprocessed-tasks': {
        'task': 'ai_backend.tasks.batch_process_unprocessed_tasks',
        'schedule': crontab(minute='*/30'),
    },
}

app.conf.timezone = 'UTC'


@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
