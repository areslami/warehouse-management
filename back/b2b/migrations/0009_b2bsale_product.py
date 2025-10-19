# Generated manually to add product field back to B2BSale

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
        ('b2b', '0008_remove_b2bsale_cottage_code_remove_b2bsale_product_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='b2bsale',
            name='product',
            field=models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='core.product', default=1),
            preserve_default=False,
        ),
    ]
