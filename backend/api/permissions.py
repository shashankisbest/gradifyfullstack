from rest_framework import permissions


class IsFaculty(permissions.BasePermission):
    """Permission class to check if user is faculty"""

    def has_permission(self, request, view):
        return request.user and hasattr(request, 'user_obj') and request.user_obj.role == 'faculty'


class IsOwner(permissions.BasePermission):
    """Permission class to check if user is the owner of the object"""

    def has_object_permission(self, request, view, obj):
        # Check if the object was created/uploaded by the current user
        if hasattr(obj, 'uploaded_by'):
            return obj.uploaded_by == request.user_obj
        elif hasattr(obj, 'faculty'):
            return obj.faculty == request.user_obj
        elif hasattr(obj, 'added_by'):
            return obj.added_by == request.user_obj
        return False
