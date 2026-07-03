"""
Celery Async Tasks — AI Processing Queue
Processes NLP analysis in background so API stays fast.
"""

import logging
from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def process_task_nlp(self, task_id: int, force: bool = False):
    """
    Async NLP processing for a single task.
    - Categorizes task
    - Scores priority
    - Extracts keywords
    - Runs sentiment analysis
    """
    try:
        from tasks.models import Task, Category, TaskActivity
        from .nlp_engine import get_nlp_engine

        task = Task.objects.select_related('category').get(id=task_id)

        if task.nlp_processed and not force:
            logger.info(f"Task {task_id} already processed, skipping.")
            return {'status': 'skipped', 'task_id': task_id}

        engine = get_nlp_engine()
        result = engine.process_task(
            title=task.title,
            description=task.description,
            due_date=task.due_date,
            user_priority=task.priority
        )

        # Get or create category
        category, _ = Category.objects.get_or_create(
            name=result['category'],
            defaults={
                'color': result.get('category_color', '#6366f1'),
                'icon': result.get('category_icon', 'folder'),
                'is_system': True,
            }
        )

        # Update task with AI results
        Task.objects.filter(id=task_id).update(
            category=category,
            ai_category_confidence=result['category_confidence'],
            ai_priority_score=result['priority_score'],
            ai_keywords=result['keywords'],
            ai_sentiment=result['sentiment'],
            nlp_processed=True,
        )

        # Log activity
        TaskActivity.objects.create(
            task=task,
            user=None,
            activity_type='ai_categorized',
            new_value={
                'category': result['category'],
                'confidence': result['category_confidence'],
                'priority_score': result['priority_score'],
                'keywords': result['keywords'][:5],
            }
        )

        logger.info(f"Task {task_id} processed: category={result['category']}, "
                    f"priority_score={result['priority_score']}")

        return {
            'status': 'success',
            'task_id': task_id,
            'category': result['category'],
            'priority_score': result['priority_score'],
        }

    except Task.DoesNotExist:
        logger.error(f"Task {task_id} not found.")
        return {'status': 'error', 'message': 'Task not found'}
    except Exception as exc:
        logger.error(f"NLP processing failed for task {task_id}: {exc}")
        raise self.retry(exc=exc)


@shared_task
def batch_process_unprocessed_tasks():
    """
    Scheduled task: Process all tasks that haven't been NLP-processed yet.
    Run periodically via Celery Beat.
    """
    from tasks.models import Task

    unprocessed = Task.objects.filter(nlp_processed=False).values_list('id', flat=True)
    count = 0
    for task_id in unprocessed:
        process_task_nlp.delay(task_id)
        count += 1

    logger.info(f"Queued {count} tasks for NLP processing.")
    return {'queued': count}


@shared_task
def generate_weekly_insights(user_id: int):
    """
    Generate weekly AI insights for a user.
    Analyzes completion patterns, bottlenecks, and suggestions.
    """
    from tasks.models import Task
    from django.utils import timezone
    from datetime import timedelta

    week_ago = timezone.now() - timedelta(days=7)
    tasks = Task.objects.filter(user_id=user_id, created_at__gte=week_ago)

    completed = tasks.filter(status='completed').count()
    total = tasks.count()
    completion_rate = (completed / total * 100) if total else 0

    overdue = tasks.filter(
        due_date__lt=timezone.now(),
        status__in=['pending', 'in_progress']
    ).count()

    # Category distribution
    from django.db.models import Count
    top_categories = (
        tasks.values('category__name')
        .annotate(count=Count('id'))
        .order_by('-count')[:3]
    )

    insights = {
        'user_id': user_id,
        'period': 'weekly',
        'stats': {
            'total_tasks': total,
            'completed': completed,
            'completion_rate': round(completion_rate, 1),
            'overdue': overdue,
            'top_categories': list(top_categories),
        },
        'recommendations': _generate_recommendations(completion_rate, overdue, total)
    }

    return insights


def _generate_recommendations(completion_rate: float, overdue: int, total: int) -> list:
    """Generate actionable recommendations from stats."""
    recs = []

    if completion_rate < 50:
        recs.append({
            'type': 'completion',
            'message': 'Your completion rate is below 50%. Try breaking tasks into smaller subtasks.',
            'priority': 'high'
        })
    if overdue > 3:
        recs.append({
            'type': 'overdue',
            'message': f'You have {overdue} overdue tasks. Consider rescheduling or delegating some.',
            'priority': 'high'
        })
    if total > 20:
        recs.append({
            'type': 'workload',
            'message': 'High task volume detected. Prioritize Critical and High tasks first.',
            'priority': 'medium'
        })

    return recs
