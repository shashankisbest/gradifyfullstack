from django.contrib import admin
from .models import User, Resource, Timetable, Scholarship


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'email', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['name', 'email']
    ordering = ['-created_at']


@admin.register(Resource)
class ResourceAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'resource_type', 'uploaded_by', 'created_at']
    list_filter = ['resource_type', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-created_at']


@admin.register(Timetable)
class TimetableAdmin(admin.ModelAdmin):
    list_display = ['id', 'day', 'subject', 'start_time', 'end_time', 'faculty']
    list_filter = ['day', 'created_at']
    search_fields = ['subject']
    ordering = ['day', 'start_time']


@admin.register(Scholarship)
class ScholarshipAdmin(admin.ModelAdmin):
    list_display = ['id', 'name', 'added_by', 'created_at']
    list_filter = ['created_at']
    search_fields = ['name', 'description']
    ordering = ['-created_at']
