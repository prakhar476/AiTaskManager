"""Tasks Admin — full model registration with filters and search."""

from django.contrib import admin
from django.utils.html import format_html
from .models import Task, Category, Tag, TaskComment, TaskActivity


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display  = ('name', 'color_preview', 'icon', 'is_system', 'task_count')
    list_filter   = ('is_system',)
    search_fields = ('name',)

    def color_preview(self, obj):
        return format_html(
            '<span style="display:inline-block;width:14px;height:14px;'
            'border-radius:3px;background:{}"></span> {}',
            obj.color, obj.color
        )
    color_preview.short_description = 'Color'

    def task_count(self, obj):
        return obj.tasks.count()
    task_count.short_description = 'Tasks'


@admin.register(Tag)
class TagAdmin(admin.ModelAdmin):
    list_display  = ('name', 'user', 'color')
    list_filter   = ('user',)
    search_fields = ('name', 'user__email')


class TaskCommentInline(admin.TabularInline):
    model  = TaskComment
    extra  = 0
    fields = ('author', 'content', 'created_at')
    readonly_fields = ('created_at',)


class TaskActivityInline(admin.TabularInline):
    model   = TaskActivity
    extra   = 0
    fields  = ('activity_type', 'old_value', 'new_value', 'created_at')
    readonly_fields = ('created_at',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'title', 'user', 'priority', 'status', 'category',
        'ai_priority_score', 'nlp_processed', 'due_date', 'created_at'
    )
    list_filter   = ('status', 'priority', 'nlp_processed', 'category')
    search_fields = ('title', 'description', 'user__email')
    ordering      = ('priority', '-created_at')
    readonly_fields = (
        'created_at', 'updated_at', 'completed_at',
        'ai_category_confidence', 'ai_priority_score',
        'ai_keywords', 'ai_sentiment', 'nlp_processed'
    )
    inlines = [TaskCommentInline, TaskActivityInline]

    fieldsets = (
        ('Core', {
            'fields': ('title', 'description', 'user', 'parent')
        }),
        ('Classification', {
            'fields': ('category', 'tags', 'priority', 'status')
        }),
        ('Dates', {
            'fields': ('due_date', 'created_at', 'updated_at', 'completed_at')
        }),
        ('Time Tracking', {
            'fields': ('estimated_minutes', 'actual_minutes')
        }),
        ('AI Metadata', {
            'fields': (
                'ai_category_confidence', 'ai_priority_score',
                'ai_keywords', 'ai_sentiment', 'nlp_processed'
            ),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display  = ('task', 'author', 'created_at')
    search_fields = ('content', 'author__email', 'task__title')


@admin.register(TaskActivity)
class TaskActivityAdmin(admin.ModelAdmin):
    list_display  = ('task', 'activity_type', 'user', 'created_at')
    list_filter   = ('activity_type',)
    search_fields = ('task__title', 'user__email')
