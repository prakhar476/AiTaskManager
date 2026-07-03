"""Custom User Model for AI Task Manager"""

from django.contrib.auth.models import AbstractUser
from django.db import models


class CustomUser(AbstractUser):
    """Extended user model with profile data."""

    email = models.EmailField(unique=True)
    avatar = models.CharField(max_length=255, blank=True, null=True)
    bio = models.TextField(max_length=500, blank=True)
    preferences = models.JSONField(default=dict, blank=True)

    # AI Preferences
    ai_suggestions_enabled = models.BooleanField(default=True)
    default_priority_model = models.CharField(
        max_length=50,
        default='balanced',
        choices=[
            ('urgent', 'Urgent First'),
            ('balanced', 'Balanced'),
            ('deadline', 'Deadline-Based'),
        ]
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return self.email

    @property
    def task_stats(self):
        """Return user's task completion statistics."""
        tasks = self.tasks.all()
        return {
            'total': tasks.count(),
            'completed': tasks.filter(status='completed').count(),
            'in_progress': tasks.filter(status='in_progress').count(),
            'pending': tasks.filter(status='pending').count(),
        }
