"""
Tasks Models — Core Data Layer
Auto-categorization and priority assignment via NLP signals
"""

from django.db import models
from django.utils import timezone
from django.conf import settings


class Category(models.Model):
    """Task categories (auto-assigned by NLP or manually set)."""

    name = models.CharField(max_length=100, unique=True)
    color = models.CharField(max_length=7, default='#6366f1')  # hex color
    icon = models.CharField(max_length=50, default='folder')
    description = models.TextField(blank=True)
    is_system = models.BooleanField(default=False)  # AI-generated vs user-created

    class Meta:
        verbose_name_plural = 'Categories'
        ordering = ['name']

    def __str__(self):
        return self.name


class Tag(models.Model):
    """Flexible tagging system."""

    name = models.CharField(max_length=50)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tags'
    )
    color = models.CharField(max_length=7, default='#8b5cf6')

    class Meta:
        unique_together = ['name', 'user']

    def __str__(self):
        return self.name


class Task(models.Model):
    """Core task model with AI-enhanced fields."""

    PRIORITY_CHOICES = [
        (1, 'Critical'),
        (2, 'High'),
        (3, 'Medium'),
        (4, 'Low'),
        (5, 'Minimal'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('in_progress', 'In Progress'),
        ('blocked', 'Blocked'),
        ('completed', 'Completed'),
        ('archived', 'Archived'),
    ]

    # Core fields
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks'
    )

    # Classification
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks'
    )
    tags = models.ManyToManyField(Tag, blank=True, related_name='tasks')

    # Priority & Status
    priority = models.IntegerField(choices=PRIORITY_CHOICES, default=3)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')

    # Dates
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    # AI Metadata
    ai_category_confidence = models.FloatField(default=0.0)
    ai_priority_score = models.FloatField(default=0.0)
    ai_suggested_category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='suggested_tasks'
    )
    ai_keywords = models.JSONField(default=list, blank=True)
    ai_sentiment = models.CharField(max_length=20, blank=True)  # positive/negative/neutral
    nlp_processed = models.BooleanField(default=False)

    # Subtasks
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True, blank=True,
        related_name='subtasks'
    )

    # Estimate
    estimated_minutes = models.PositiveIntegerField(null=True, blank=True)
    actual_minutes = models.PositiveIntegerField(null=True, blank=True)

    class Meta:
        ordering = ['priority', '-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['user', 'priority']),
            models.Index(fields=['due_date']),
        ]

    def __str__(self):
        return f"[{self.get_priority_display()}] {self.title}"

    def save(self, *args, **kwargs):
        if self.status == 'completed' and not self.completed_at:
            self.completed_at = timezone.now()
        elif self.status != 'completed':
            self.completed_at = None
        super().save(*args, **kwargs)

    @property
    def is_overdue(self):
        if self.due_date and self.status not in ('completed', 'archived'):
            return timezone.now() > self.due_date
        return False

    @property
    def days_until_due(self):
        if self.due_date:
            delta = self.due_date - timezone.now()
            return delta.days
        return None


class TaskComment(models.Model):
    """Comments on tasks."""

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"Comment by {self.author} on {self.task}"


class TaskActivity(models.Model):
    """Audit trail for task changes."""

    ACTIVITY_TYPES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('status_changed', 'Status Changed'),
        ('priority_changed', 'Priority Changed'),
        ('ai_categorized', 'AI Categorized'),
        ('ai_prioritized', 'AI Prioritized'),
        ('completed', 'Completed'),
    ]

    task = models.ForeignKey(Task, on_delete=models.CASCADE, related_name='activities')
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True
    )
    activity_type = models.CharField(max_length=30, choices=ACTIVITY_TYPES)
    old_value = models.JSONField(null=True, blank=True)
    new_value = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
