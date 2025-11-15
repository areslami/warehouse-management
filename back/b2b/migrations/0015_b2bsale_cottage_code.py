from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('b2b', '0014_alter_b2boffer_warehouse_receipt'),
    ]

    operations = [
        migrations.AddField(
            model_name='b2bsale',
            name='cottage_code',
            field=models.CharField(blank=True, default='', max_length=100),
        ),
    ]
