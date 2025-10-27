from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('auth/login', views.login_view, name='login'),

    # Resources
    path('resources/', views.resource_list_create, name='resource-list-create'),
    path('resources/<int:pk>/', views.resource_detail, name='resource-detail'),

    # Timetable
    path('timetable/', views.timetable_list_create, name='timetable-list-create'),
    path('timetable/<int:pk>/', views.timetable_detail, name='timetable-detail'),

    # Scholarships
    path('scholarships/', views.scholarship_list_create, name='scholarship-list-create'),
    path('scholarships/<int:pk>/', views.scholarship_detail, name='scholarship-detail'),
]
