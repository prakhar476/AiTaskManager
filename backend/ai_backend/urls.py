"""AI Backend URL Configuration"""

from django.urls import path
from . import views

urlpatterns = [
    path('analyze/', views.AnalyzeTaskView.as_view(), name='ai-analyze'),
    path('suggestions/', views.SmartSuggestionsView.as_view(), name='ai-suggestions'),
    path('batch-analyze/', views.BatchAnalyzeView.as_view(), name='ai-batch-analyze'),
    path('insights/', views.UserInsightsView.as_view(), name='ai-insights'),
]
