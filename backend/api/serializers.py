from rest_framework import serializers
from .models import User, Resource, Timetable, Scholarship


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model - used in nested representations"""
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role']


class UserDetailSerializer(serializers.ModelSerializer):
    """Serializer for User model with full details"""
    class Meta:
        model = User
        fields = ['id', 'name', 'email', 'role', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_at', 'updated_at']


class ResourceSerializer(serializers.ModelSerializer):
    """Serializer for Resource model"""
    uploaded_by = UserSerializer(read_only=True)

    class Meta:
        model = Resource
        fields = [
            'id', 'title', 'description', 'resource_type',
            'file', 'link', 'uploaded_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'uploaded_by', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate resource data"""
        resource_type = data.get('resource_type')
        file = data.get('file')
        link = data.get('link')

        # Check if resource_type is valid
        if resource_type not in ['file', 'link']:
            raise serializers.ValidationError({
                'resource_type': 'resource_type must be "file" or "link"'
            })

        # Validate file is provided when type is 'file'
        if resource_type == 'file' and not file:
            raise serializers.ValidationError({
                'file': 'File is required when resource_type is "file"'
            })

        # Validate link is provided when type is 'link'
        if resource_type == 'link' and not link:
            raise serializers.ValidationError({
                'link': 'Link is required when resource_type is "link"'
            })

        # Validate file size (10MB max)
        if file and file.size > 10 * 1024 * 1024:
            raise serializers.ValidationError({
                'file': 'File size exceeds 10MB limit'
            })

        # Validate file type
        if file:
            allowed_extensions = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
            file_extension = file.name.split('.')[-1].lower()
            if file_extension not in allowed_extensions:
                raise serializers.ValidationError({
                    'file': f'File type not allowed. Use PDF, DOC, DOCX, PPT, PPTX, or TXT'
                })

        return data


class TimetableSerializer(serializers.ModelSerializer):
    """Serializer for Timetable model"""
    faculty = UserSerializer(read_only=True)

    class Meta:
        model = Timetable
        fields = [
            'id', 'day', 'start_time', 'end_time',
            'subject', 'faculty', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'faculty', 'created_at', 'updated_at']

    def validate(self, data):
        """Validate timetable data"""
        start_time = data.get('start_time')
        end_time = data.get('end_time')
        day = data.get('day')

        # Validate end_time is after start_time
        if start_time and end_time and end_time <= start_time:
            raise serializers.ValidationError({
                'end_time': 'End time must be after start time'
            })

        # Validate day is valid
        valid_days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
        if day and day not in valid_days:
            raise serializers.ValidationError({
                'day': 'Day must be Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday'
            })

        return data

    def validate_overlap(self, faculty, day, start_time, end_time, instance_id=None):
        """Check for overlapping time slots"""
        # Get all timetable entries for the same faculty on the same day
        overlapping = Timetable.objects.filter(
            faculty=faculty,
            day=day
        )

        # Exclude the current instance if updating
        if instance_id:
            overlapping = overlapping.exclude(pk=instance_id)

        # Check for time overlap
        for entry in overlapping:
            if start_time < entry.end_time and end_time > entry.start_time:
                raise serializers.ValidationError({
                    'error': f'This time slot overlaps with an existing class on {day}'
                })


class ScholarshipSerializer(serializers.ModelSerializer):
    """Serializer for Scholarship model"""
    added_by = UserSerializer(read_only=True)

    class Meta:
        model = Scholarship
        fields = [
            'id', 'name', 'description', 'link',
            'added_by', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'added_by', 'created_at', 'updated_at']

    def validate_link(self, value):
        """Validate scholarship link"""
        if not value:
            raise serializers.ValidationError('Link must be a valid URL')
        return value
