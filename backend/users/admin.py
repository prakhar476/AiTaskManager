"""Users Admin."""

from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser


@admin.register(CustomUser)
class CustomUserAdmin(UserAdmin):
    list_display  = ('email', 'username', 'first_name', 'last_name', 'is_staff', 'date_joined')
    list_filter   = ('is_staff', 'is_active', 'ai_suggestions_enabled')
    search_fields = ('email', 'username', 'first_name', 'last_name')
    ordering      = ('-date_joined',)

    fieldsets = UserAdmin.fieldsets + (
        ('AI Preferences', {
            'fields': ('ai_suggestions_enabled', 'default_priority_model', 'bio', 'preferences')
        }),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('Profile', {
            'fields': ('email', 'first_name', 'last_name')
        }),
    )
