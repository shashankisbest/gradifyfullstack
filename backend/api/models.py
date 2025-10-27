from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.core.validators import FileExtensionValidator
from django.core.exceptions import ValidationError


class User(models.Model):
    """User model for both students and faculty"""
    ROLE_CHOICES = [
        ('student', 'Student'),
        ('faculty', 'Faculty'),
    ]

    name = models.CharField(max_length=150)
    email = models.EmailField(unique=True, db_index=True)
    password = models.CharField(max_length=255)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.name} ({self.role})"

    def set_password(self, raw_password):
        """Hash and set the password"""
        self.password = make_password(raw_password)

    def check_password(self, raw_password):
        """Check if the provided password matches"""
        return check_password(raw_password, self.password)


class Resource(models.Model):
    """Resource model for academic materials"""
    RESOURCE_TYPE_CHOICES = [
        ('file', 'File'),
        ('link', 'Link'),
    ]

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True, null=True)
    resource_type = models.CharField(max_length=4, choices=RESOURCE_TYPE_CHOICES)
    file = models.FileField(
        upload_to='resources/',
        null=True,
        blank=True,
        validators=[
            FileExtensionValidator(
                allowed_extensions=['pdf', 'doc', 'docx', 'ppt', 'pptx', 'txt']
            )
        ]
    )
    link = models.URLField(null=True, blank=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='resources')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'resources'
        ordering = ['-created_at']

    def __str__(self):
        return self.title

    def clean(self):
        """Validate resource type and corresponding fields"""
        if self.resource_type == 'file' and not self.file:
            raise ValidationError('File is required when resource type is "file"')
        if self.resource_type == 'link' and not self.link:
            raise ValidationError('Link is required when resource type is "link"')

        # Validate that uploaded_by is a faculty member
        if self.uploaded_by and self.uploaded_by.role != 'faculty':
            raise ValidationError('Only faculty members can upload resources')

        # Validate file size (10MB max)
        if self.file and self.file.size > 10 * 1024 * 1024:
            raise ValidationError('File size exceeds 10MB limit')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Timetable(models.Model):
    """Timetable model for class schedules"""
    DAY_CHOICES = [
        ('Monday', 'Monday'),
        ('Tuesday', 'Tuesday'),
        ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'),
        ('Friday', 'Friday'),
        ('Saturday', 'Saturday'),
        ('Sunday', 'Sunday'),
    ]

    day = models.CharField(max_length=10, choices=DAY_CHOICES)
    start_time = models.TimeField()
    end_time = models.TimeField()
    subject = models.CharField(max_length=100)
    faculty = models.ForeignKey(User, on_delete=models.CASCADE, related_name='timetable_entries')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'timetable'
        ordering = ['day', 'start_time']

    def __str__(self):
        return f"{self.day} - {self.subject} ({self.start_time} - {self.end_time})"

    def clean(self):
        """Validate timetable entry"""
        # Validate that faculty is a faculty member
        if self.faculty and self.faculty.role != 'faculty':
            raise ValidationError('Only faculty members can create timetable entries')

        # Validate that end_time is after start_time
        if self.start_time and self.end_time and self.end_time <= self.start_time:
            raise ValidationError('End time must be after start time')

        # Check for overlapping time slots on the same day for the same faculty
        if self.faculty:
            overlapping = Timetable.objects.filter(
                faculty=self.faculty,
                day=self.day
            ).exclude(pk=self.pk)

            for entry in overlapping:
                # Check if there's any overlap
                if (self.start_time < entry.end_time and self.end_time > entry.start_time):
                    raise ValidationError(f'This time slot overlaps with an existing class on {self.day}')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)


class Scholarship(models.Model):
    """Scholarship model for funding opportunities"""
    name = models.CharField(max_length=200)
    description = models.TextField()
    link = models.URLField()
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='scholarships')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'scholarships'
        ordering = ['-created_at']

    def __str__(self):
        return self.name

    def clean(self):
        """Validate scholarship entry"""
        # Validate that added_by is a faculty member
        if self.added_by and self.added_by.role != 'faculty':
            raise ValidationError('Only faculty members can add scholarships')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
