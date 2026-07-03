"""Task Filters for advanced querying"""

import django_filters
from django.utils import timezone
from .models import Task


class TaskFilter(django_filters.FilterSet):
    status = django_filters.MultipleChoiceFilter(choices=Task.STATUS_CHOICES)
    priority = django_filters.MultipleChoiceFilter(choices=Task.PRIORITY_CHOICES)
    category = django_filters.NumberFilter(field_name='category__id')
    due_before = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='lte')
    due_after = django_filters.DateTimeFilter(field_name='due_date', lookup_expr='gte')
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    is_overdue = django_filters.BooleanFilter(method='filter_overdue')
    has_due_date = django_filters.BooleanFilter(method='filter_has_due_date')
    tag = django_filters.CharFilter(field_name='tags__name', lookup_expr='iexact')
    nlp_processed = django_filters.BooleanFilter()
    parent = django_filters.NumberFilter(field_name='parent__id')
    top_level = django_filters.BooleanFilter(method='filter_top_level')

    class Meta:
        model = Task
        fields = ['status', 'priority', 'category', 'nlp_processed']

    def filter_overdue(self, queryset, name, value):
        if value:
            return queryset.filter(
                due_date__lt=timezone.now(),
                status__in=['pending', 'in_progress']
            )
        return queryset.exclude(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        )

    def filter_has_due_date(self, queryset, name, value):
        if value:
            return queryset.filter(due_date__isnull=False)
        return queryset.filter(due_date__isnull=True)

    def filter_top_level(self, queryset, name, value):
        if value:
            return queryset.filter(parent__isnull=True)
        return queryset.filter(parent__isnull=False)
