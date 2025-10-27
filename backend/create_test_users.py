import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

from api.models import User

# Create test student
student, created = User.objects.get_or_create(
    email='student@test.com',
    defaults={
        'name': 'Test Student',
        'role': 'student'
    }
)
if created:
    student.set_password('test123')
    student.save()
    print(f'Created student: {student.email} / test123')
else:
    print(f'Student already exists: {student.email}')

# Create test faculty
faculty, created = User.objects.get_or_create(
    email='faculty@test.com',
    defaults={
        'name': 'Test Faculty',
        'role': 'faculty'
    }
)
if created:
    faculty.set_password('test123')
    faculty.save()
    print(f'Created faculty: {faculty.email} / test123')
else:
    print(f'Faculty already exists: {faculty.email}')

print('\nTest users created successfully!')
print('Student login: student@test.com / test123')
print('Faculty login: faculty@test.com / test123')
