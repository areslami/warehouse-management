from django.db import models
from django.db.models import Q


class Indicator(models.Model):
    name = models.CharField(
        max_length=100,
        unique=True,
        help_text="Unique indicator prefix used to build generated IDs.",
    )
    counter = models.PositiveIntegerField(
        default=0,
        help_text="Number of identifiers created with this indicator.",
    )
    belongs = models.CharField(
        max_length=100,
        help_text="Machine key describing the entity (e.g. sale_proforma) this indicator belongs to.",
    )
    format_template = models.TextField(
        default="{{COUNTER3}}",
        help_text="Template used to build identifiers. Supports literal text plus tokens such as {{JYEAR4}} or {{COUNTER4}}.",
    )
    is_default = models.BooleanField(
        default=False,
        help_text="Automatically selected indicator for its section.",
    )
    start_number = models.PositiveIntegerField(
        default=1,
        help_text="Starting number for the counter range.",
    )
    end_number = models.PositiveIntegerField(
        default=999,
        help_text="Ending number for the counter range. Used to auto-calculate digit count.",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["belongs"],
                condition=Q(is_default=True),
                name="unique_default_indicator_per_section",
            )
        ]

    def __str__(self):
        suffix = " *" if self.is_default else ""
        return f"{self.name} ({self.belongs}) #{self.counter}{suffix}"
