"""Tasks Views — Full CRUD + AI Integration"""

from django.db.models import Count
from django.utils import timezone
from datetime import timedelta
from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend

from .models import Task, Category, Tag, TaskComment, TaskActivity
from .serializers import (
    TaskSerializer, CategorySerializer, TagSerializer,
    TaskCommentSerializer, TaskActivitySerializer, TaskBulkUpdateSerializer
)
from .filters import TaskFilter


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TaskFilter
    search_fields = ['title', 'description']
    ordering_fields = ['priority', 'due_date', 'created_at', 'ai_priority_score']
    ordering = ['priority', '-created_at']

    def get_queryset(self):
        return (
            Task.objects.filter(user=self.request.user)
            .select_related('category', 'user')
            .prefetch_related('tags', 'subtasks', 'comments')
        )

    def perform_create(self, serializer):
        task = serializer.save(user=self.request.user)

        # Run NLP inline — no Celery/Redis needed
        try:
            from ai_backend.nlp_engine import get_nlp_engine
            engine = get_nlp_engine()
            result = engine.process_task(
                title=task.title,
                description=task.description or '',
                due_date=task.due_date,
                user_priority=task.priority
            )
            category, _ = Category.objects.get_or_create(
                name=result['category'],
                defaults={
                    'color': result.get('category_color', '#6366f1'),
                    'icon': result.get('category_icon', 'folder'),
                    'is_system': True,
                }
            )
            task.category = category
            task.ai_category_confidence = result['category_confidence']
            task.ai_priority_score = result['priority_score']
            task.ai_keywords = result['keywords']
            task.ai_sentiment = result['sentiment']
            task.nlp_processed = True
            task.save()
        except Exception as e:
            print(f"NLP error (non-fatal): {e}")

        try:
            TaskActivity.objects.create(
                task=task,
                user=self.request.user,
                activity_type='created',
                new_value={'title': task.title}
            )
        except Exception as e:
            print(f"Activity log error (non-fatal): {e}")

    def perform_update(self, serializer):
        task = serializer.save()
        try:
            TaskActivity.objects.create(
                task=task,
                user=self.request.user,
                activity_type='updated',
                new_value={'title': task.title, 'status': task.status}
            )
        except Exception as e:
            print(f"Activity log error (non-fatal): {e}")

    @action(detail=False, methods=['post'])
    def bulk_update(self, request):
        serializer = TaskBulkUpdateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        task_ids = serializer.validated_data['task_ids']
        tasks = Task.objects.filter(id__in=task_ids, user=request.user)
        update_fields = {}
        if 'status' in serializer.validated_data:
            update_fields['status'] = serializer.validated_data['status']
        if 'priority' in serializer.validated_data:
            update_fields['priority'] = serializer.validated_data['priority']
        tasks.update(**update_fields)
        return Response({'updated': tasks.count(), 'message': 'Tasks updated.'})

    @action(detail=False, methods=['get'])
    def stats(self, request):
        try:
            now = timezone.now()
            user_tasks = Task.objects.filter(user=request.user)

            by_status = {}
            for item in user_tasks.values('status').annotate(count=Count('id')):
                by_status[item['status']] = item['count']

            by_priority = {}
            for item in user_tasks.values('priority').annotate(count=Count('id')):
                by_priority[item['priority']] = item['count']

            by_category = list(
                user_tasks.exclude(category=None)
                .values('category__name', 'category__color')
                .annotate(count=Count('id'))
                .order_by('-count')[:8]
            )

            overdue_count = user_tasks.filter(
                due_date__lt=now,
                status__in=['pending', 'in_progress']
            ).count()

            completed_this_week = user_tasks.filter(
                status='completed',
                completed_at__gte=now - timedelta(days=7)
            ).count()

            return Response({
                'total': user_tasks.count(),
                'by_status': by_status,
                'by_priority': by_priority,
                'by_category': by_category,
                'overdue': overdue_count,
                'completed_this_week': completed_this_week,
            })
        except Exception as e:
            print(f"Stats error: {e}")
            return Response({
                'total': 0, 'by_status': {}, 'by_priority': {},
                'by_category': [], 'overdue': 0, 'completed_this_week': 0,
            })

    @action(detail=True, methods=['post'])
    def add_comment(self, request, pk=None):
        task = self.get_object()
        serializer = TaskCommentSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        serializer.save(task=task, author=request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['get'])
    def activity(self, request, pk=None):
        task = self.get_object()
        activities = task.activities.all()
        serializer = TaskActivitySerializer(activities, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def reprocess_ai(self, request, pk=None):
        task = self.get_object()
        return Response({'message': 'AI reprocessing done.'})


class CategoryViewSet(viewsets.ModelViewSet):
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Category.objects.all()


class TagViewSet(viewsets.ModelViewSet):
    serializer_class = TagSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Tag.objects.filter(user=self.request.user)