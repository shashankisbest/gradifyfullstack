from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.core.exceptions import ValidationError

from .models import User, Resource, Timetable, Scholarship
from .serializers import (
    UserSerializer, UserDetailSerializer,
    ResourceSerializer, TimetableSerializer, ScholarshipSerializer
)
from .permissions import IsFaculty, IsOwner


# Custom authentication middleware function
def get_user_from_token(request):
    """Extract user from JWT token in request"""
    from rest_framework_simplejwt.authentication import JWTAuthentication
    jwt_auth = JWTAuthentication()
    try:
        validated_token = jwt_auth.get_validated_token(
            jwt_auth.get_raw_token(jwt_auth.get_header(request))
        )
        user_id = validated_token.get('user_id')
        user = User.objects.get(pk=user_id)
        request.user_obj = user
        return user
    except Exception:
        return None


# Authentication Views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    """Login endpoint - validates credentials and returns JWT tokens"""
    email = request.data.get('email')
    password = request.data.get('password')
    role = request.data.get('role')

    # Validate required fields
    if not email or not password or not role:
        return Response(
            {'error': 'Email, password, and role are required'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Find user by email
        user = User.objects.get(email=email)

        # Check password
        if not user.check_password(password):
            return Response(
                {'error': 'Invalid credentials'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Check role matches
        if user.role != role:
            return Response(
                {'error': 'Invalid credentials for selected role'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generate JWT tokens
        refresh = RefreshToken()
        refresh['user_id'] = user.id
        refresh['role'] = user.role

        # Return tokens and user data
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id': user.id,
                'name': user.name,
                'email': user.email,
                'role': user.role
            }
        }, status=status.HTTP_200_OK)

    except User.DoesNotExist:
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


# Resource Views
@api_view(['GET', 'POST'])
def resource_list_create(request):
    """List all resources or create a new resource"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method == 'GET':
        # List all resources (accessible to all authenticated users)
        resources = Resource.objects.all()
        serializer = ResourceSerializer(resources, many=True)
        return Response({'resources': serializer.data}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new resource (faculty only)
        if user.role != 'faculty':
            return Response(
                {'error': 'Only faculty can create resources'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ResourceSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(uploaded_by=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def resource_detail(request, pk):
    """Update or delete a specific resource"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Get resource
    try:
        resource = Resource.objects.get(pk=pk)
    except Resource.DoesNotExist:
        return Response(
            {'error': 'Resource not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user is the owner
    if resource.uploaded_by != user:
        return Response(
            {'error': 'You can only edit your own resources'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PUT':
        serializer = ResourceSerializer(resource, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        resource.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Timetable Views
@api_view(['GET', 'POST'])
def timetable_list_create(request):
    """List all timetable entries or create a new entry"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method == 'GET':
        # List all timetable entries (accessible to all authenticated users)
        timetable = Timetable.objects.all()
        serializer = TimetableSerializer(timetable, many=True)
        return Response({'timetable': serializer.data}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new timetable entry (faculty only)
        if user.role != 'faculty':
            return Response(
                {'error': 'Only faculty can create timetable entries'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = TimetableSerializer(data=request.data)
        if serializer.is_valid():
            # Check for time overlap
            try:
                serializer.validate_overlap(
                    faculty=user,
                    day=serializer.validated_data['day'],
                    start_time=serializer.validated_data['start_time'],
                    end_time=serializer.validated_data['end_time']
                )
                serializer.save(faculty=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def timetable_detail(request, pk):
    """Update or delete a specific timetable entry"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Get timetable entry
    try:
        timetable_entry = Timetable.objects.get(pk=pk)
    except Timetable.DoesNotExist:
        return Response(
            {'error': 'Timetable entry not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user is the owner
    if timetable_entry.faculty != user:
        return Response(
            {'error': 'You can only edit your own timetable entries'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PUT':
        serializer = TimetableSerializer(timetable_entry, data=request.data, partial=True)
        if serializer.is_valid():
            # Check for time overlap
            try:
                serializer.validate_overlap(
                    faculty=user,
                    day=serializer.validated_data.get('day', timetable_entry.day),
                    start_time=serializer.validated_data.get('start_time', timetable_entry.start_time),
                    end_time=serializer.validated_data.get('end_time', timetable_entry.end_time),
                    instance_id=timetable_entry.id
                )
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        timetable_entry.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


# Scholarship Views
@api_view(['GET', 'POST'])
def scholarship_list_create(request):
    """List all scholarships or create a new scholarship"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    if request.method == 'GET':
        # List all scholarships (accessible to all authenticated users)
        scholarships = Scholarship.objects.all()
        serializer = ScholarshipSerializer(scholarships, many=True)
        return Response({'scholarships': serializer.data}, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Create new scholarship (faculty only)
        if user.role != 'faculty':
            return Response(
                {'error': 'Only faculty can create scholarships'},
                status=status.HTTP_403_FORBIDDEN
            )

        serializer = ScholarshipSerializer(data=request.data)
        if serializer.is_valid():
            try:
                serializer.save(added_by=user)
                return Response(serializer.data, status=status.HTTP_201_CREATED)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT', 'DELETE'])
def scholarship_detail(request, pk):
    """Update or delete a specific scholarship"""
    # Get user from token
    user = get_user_from_token(request)
    if not user:
        return Response(
            {'error': 'Authentication required'},
            status=status.HTTP_401_UNAUTHORIZED
        )

    # Get scholarship
    try:
        scholarship = Scholarship.objects.get(pk=pk)
    except Scholarship.DoesNotExist:
        return Response(
            {'error': 'Scholarship not found'},
            status=status.HTTP_404_NOT_FOUND
        )

    # Check if user is the owner
    if scholarship.added_by != user:
        return Response(
            {'error': 'You can only edit your own scholarships'},
            status=status.HTTP_403_FORBIDDEN
        )

    if request.method == 'PUT':
        serializer = ScholarshipSerializer(scholarship, data=request.data, partial=True)
        if serializer.is_valid():
            try:
                serializer.save()
                return Response(serializer.data, status=status.HTTP_200_OK)
            except ValidationError as e:
                return Response(
                    {'error': str(e)},
                    status=status.HTTP_400_BAD_REQUEST
                )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        scholarship.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
