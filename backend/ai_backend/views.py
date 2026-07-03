"""AI Backend Views — Smart Suggestions & NLP Endpoints"""

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions, status
from .nlp_engine import get_nlp_engine
from .serializers import (
    NLPAnalysisRequestSerializer,
    SmartSuggestionSerializer,
)


class AnalyzeTaskView(APIView):
    """
    POST /api/v1/ai/analyze/
    Real-time NLP analysis of task content (no DB write).
    Used for live feedback in the UI as user types.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = NLPAnalysisRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        title = serializer.validated_data['title']
        description = serializer.validated_data.get('description', '')
        due_date = serializer.validated_data.get('due_date')

        engine = get_nlp_engine()
        result = engine.process_task(
            title=title,
            description=description,
            due_date=due_date
        )

        return Response({
            'category': {
                'suggested': result['category'],
                'confidence': result['category_confidence'],
                'color': result['category_color'],
                'icon': result['category_icon'],
                'candidates': result['candidates'],
            },
            'priority': {
                'score': result['priority_score'],
                'suggested': result['suggested_priority'],
                'signals': result['priority_signals'],
            },
            'keywords': result['keywords'],
            'sentiment': result['sentiment'],
            'suggestions': result['suggestions'],
        })


class SmartSuggestionsView(APIView):
    """
    POST /api/v1/ai/suggestions/
    Get smart suggestions for improving a task.
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        title = request.data.get('title', '')
        description = request.data.get('description', '')

        if not title:
            return Response(
                {'error': 'Title is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Get user's recent tasks for context
        from tasks.models import Task
        recent_tasks = list(
            Task.objects.filter(user=request.user)
            .order_by('-created_at')[:10]
            .values('title', 'category__name', 'status')
        )

        engine = get_nlp_engine()
        suggestions = engine.generate_suggestions(title, description, recent_tasks)

        return Response({'suggestions': suggestions})


class BatchAnalyzeView(APIView):
    """
    POST /api/v1/ai/batch-analyze/
    Analyze multiple tasks at once (for imports).
    """
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        tasks_data = request.data.get('tasks', [])

        if not tasks_data or len(tasks_data) > 50:
            return Response(
                {'error': 'Provide 1-50 tasks.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        engine = get_nlp_engine()
        results = engine.batch_process(tasks_data)

        return Response({'results': results, 'processed': len(results)})


class UserInsightsView(APIView):
    """
    GET /api/v1/ai/insights/
    AI-generated insights about the user's task patterns.
    """
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        from tasks.models import Task
        from django.db.models import Count, Avg
        from django.utils import timezone
        from datetime import timedelta

        user = request.user
        tasks = Task.objects.filter(user=user)

        # Completion velocity (last 30 days)
        month_ago = timezone.now() - timedelta(days=30)
        recent_completed = tasks.filter(
            status='completed',
            completed_at__gte=month_ago
        ).count()

        # Category breakdown
        category_dist = list(
            tasks.values('category__name', 'category__color')
            .annotate(count=Count('id'))
            .order_by('-count')[:6]
        )

        # Priority distribution
        priority_dist = list(
            tasks.values('priority')
            .annotate(count=Count('id'))
            .order_by('priority')
        )

        # Average time estimates vs actuals
        time_analysis = tasks.filter(
            estimated_minutes__isnull=False,
            actual_minutes__isnull=False
        ).aggregate(
            avg_estimated=Avg('estimated_minutes'),
            avg_actual=Avg('actual_minutes')
        )

        # Generate AI recommendations
        total = tasks.count()
        completed = tasks.filter(status='completed').count()
        overdue = tasks.filter(
            due_date__lt=timezone.now(),
            status__in=['pending', 'in_progress']
        ).count()

        completion_rate = (completed / total * 100) if total else 0

        return Response({
            'overview': {
                'total_tasks': total,
                'completed': completed,
                'completion_rate': round(completion_rate, 1),
                'overdue': overdue,
                'completed_last_30_days': recent_completed,
            },
            'category_distribution': category_dist,
            'priority_distribution': priority_dist,
            'time_analysis': time_analysis,
            'recommendations': self._get_recommendations(completion_rate, overdue, total),
        })

    def _get_recommendations(self, completion_rate, overdue, total):
        recs = []
        if completion_rate < 40:
            recs.append({
                'type': 'productivity',
                'title': 'Low completion rate',
                'message': 'Try the 2-minute rule: if a task takes less than 2 minutes, do it now.',
                'icon': 'zap'
            })
        if overdue > 0:
            recs.append({
                'type': 'overdue',
                'title': f'{overdue} overdue task{"s" if overdue > 1 else ""}',
                'message': 'Address overdue items first to reduce cognitive load.',
                'icon': 'alert-circle'
            })
        if total > 30:
            recs.append({
                'type': 'focus',
                'title': 'Task overload detected',
                'message': 'Focus on 3 MITs (Most Important Tasks) per day.',
                'icon': 'target'
            })
        if not recs:
            recs.append({
                'type': 'success',
                'title': 'Great momentum!',
                'message': "You're managing tasks effectively. Keep it up!",
                'icon': 'trending-up'
            })
        return recs
