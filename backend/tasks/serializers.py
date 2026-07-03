"""Tasks Serializers"""

from rest_framework import serializers
from .models import Task, Category, Tag, TaskComment, TaskActivity


class CategorySerializer(serializers.ModelSerializer):
    task_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'color', 'icon', 'description', 'is_system', 'task_count')

    def get_task_count(self, obj):
        user = self.context['request'].user
        return obj.tasks.filter(user=user).count()


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ('id', 'name', 'color')

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        return super().create(validated_data)


class TaskCommentSerializer(serializers.ModelSerializer):
    author_name = serializers.ReadOnlyField(source='author.get_full_name')
    author_email = serializers.ReadOnlyField(source='author.email')

    class Meta:
        model = TaskComment
        fields = ('id', 'content', 'author_name', 'author_email', 'created_at', 'updated_at')
        read_only_fields = ('id', 'created_at', 'updated_at')


class TaskActivitySerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source='user.get_full_name')

    class Meta:
        model = TaskActivity
        fields = ('id', 'activity_type', 'old_value', 'new_value', 'user_name', 'created_at')


class SubtaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ('id', 'title', 'status', 'priority', 'due_date', 'created_at')


class TaskSerializer(serializers.ModelSerializer):
    category_name = serializers.ReadOnlyField(source='category.name')
    category_color = serializers.ReadOnlyField(source='category.color')
    tags = TagSerializer(many=True, read_only=True)
    tag_ids = serializers.PrimaryKeyRelatedField(
        queryset=Tag.objects.all(),
        many=True,
        write_only=True,
        source='tags',
        required=False
    )
    subtasks = SubtaskSerializer(many=True, read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    is_overdue = serializers.ReadOnlyField()
    days_until_due = serializers.ReadOnlyField()
    priority_label = serializers.ReadOnlyField(source='get_priority_display')

    class Meta:
        model = Task
        fields = (
            'id', 'title', 'description', 'status', 'priority', 'priority_label',
            'category', 'category_name', 'category_color', 'tags', 'tag_ids',
            'due_date', 'created_at', 'updated_at', 'completed_at',
            'ai_category_confidence', 'ai_priority_score', 'ai_keywords',
            'ai_sentiment', 'nlp_processed', 'estimated_minutes', 'actual_minutes',
            'parent', 'subtasks', 'comments', 'is_overdue', 'days_until_due'
        )
        read_only_fields = (
            'id', 'created_at', 'updated_at', 'completed_at',
            'ai_category_confidence', 'ai_priority_score', 'ai_keywords',
            'ai_sentiment', 'nlp_processed', 'is_overdue', 'days_until_due'
        )

    def create(self, validated_data):
        validated_data['user'] = self.context['request'].user
        tags = validated_data.pop('tags', [])
        task = Task.objects.create(**validated_data)
        task.tags.set(tags)
        return task

    def update(self, instance, validated_data):
        tags = validated_data.pop('tags', None)
        task = super().update(instance, validated_data)
        if tags is not None:
            task.tags.set(tags)
        return task


class TaskBulkUpdateSerializer(serializers.Serializer):
    """Bulk update tasks (status, priority)."""
    task_ids = serializers.ListField(child=serializers.IntegerField())
    status = serializers.ChoiceField(choices=Task.STATUS_CHOICES, required=False)
    priority = serializers.ChoiceField(choices=Task.PRIORITY_CHOICES, required=False)
