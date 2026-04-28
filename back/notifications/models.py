from django.db import models
from django.utils import timezone


class Notification(models.Model):
    ENTITY_TYPES = [
        ('dispatch', 'Dispatch Issue'),
        ('offer', 'B2B Offer'),
    ]

    entity_type = models.CharField(max_length=20, choices=ENTITY_TYPES)
    entity_id = models.CharField(max_length=100)
    title = models.CharField(max_length=255)
    message = models.CharField(max_length=500)
    deadline = models.DateTimeField()
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('entity_type', 'entity_id')
        ordering = ['-created_at']

    def mark_read(self):
        if not self.is_read:
            self.is_read = True
            self.read_at = timezone.now()
            self.save(update_fields=['is_read', 'read_at'])

    @property
    def is_expired_read(self):
        if not self.is_read or not self.read_at:
            return False
        return (timezone.now() - self.read_at).days >= 7
