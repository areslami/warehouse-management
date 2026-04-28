from django.utils import timezone
from datetime import timedelta
from rest_framework.decorators import api_view
from rest_framework.response import Response

from .models import Notification
from .generator import generate_deadline_notifications


@api_view(['GET'])
def list_notifications(request):
    # Lazily generate any new 24h-window notifications on each poll
    generate_deadline_notifications()

    # Return all notifications except those read more than 7 days ago
    week_ago = timezone.now() - timedelta(days=7)
    qs = Notification.objects.exclude(is_read=True, read_at__lt=week_ago)

    data = [
        {
            'id': n.id,
            'entity_type': n.entity_type,
            'entity_id': n.entity_id,
            'title': n.title,
            'message': n.message,
            'deadline': n.deadline.strftime('%Y-%m-%dT%H:%M:%S'),
            'is_read': n.is_read,
            'created_at': n.created_at.strftime('%Y-%m-%dT%H:%M:%S'),
        }
        for n in qs
    ]
    return Response({'notifications': data, 'unread_count': sum(1 for n in data if not n['is_read'])})


@api_view(['PATCH'])
def mark_read(request, pk):
    try:
        n = Notification.objects.get(pk=pk)
    except Notification.DoesNotExist:
        return Response({'error': 'Not found'}, status=404)
    n.mark_read()
    return Response({'ok': True})


@api_view(['PATCH'])
def mark_all_read(request):
    now = timezone.now()
    Notification.objects.filter(is_read=False).update(is_read=True, read_at=now)
    return Response({'ok': True})
