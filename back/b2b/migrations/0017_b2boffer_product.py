import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("b2b", "0016_alter_b2bsale_cottage_code"),
        ("core", "0005_indicator_end_number_indicator_start_number"),
    ]

    operations = [
        migrations.AddField(
            model_name="b2boffer",
            name="product",
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.PROTECT,
                to="core.product",
            ),
        ),
    ]
