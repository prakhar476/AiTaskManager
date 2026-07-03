"""AI Backend Serializers"""

from rest_framework import serializers


class NLPAnalysisRequestSerializer(serializers.Serializer):
    title = serializers.CharField(max_length=255)
    description = serializers.CharField(required=False, allow_blank=True)
    due_date = serializers.DateTimeField(required=False, allow_null=True)


class SmartSuggestionSerializer(serializers.Serializer):
    type = serializers.CharField()
    content = serializers.CharField()
    value = serializers.JSONField()
    confidence = serializers.FloatField()
