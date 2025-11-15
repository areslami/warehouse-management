from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("b2b", "0015_b2bsale_cottage_code"),
    ]

    operations = [
        migrations.AlterField(
            model_name="b2bsale",
            name="cottage_code",
            field=models.CharField(default="", max_length=100),
        ),
    ]
