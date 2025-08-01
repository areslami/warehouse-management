# marketplace/forms.py
from django import forms
from django.forms import FileField
from .models import MarketplaceSale, ProductOffer


class MarketplaceSaleCreateForm(forms.ModelForm):
    """فرم ایجاد فروش بازارگاه با آپلود اکسل"""
    
    excel_file = FileField(
        required=False,
        label='فایل اکسل خریدها',
        help_text='فایل اکسل حاوی اطلاعات خریدها را انتخاب کنید (اختیاری)',
        widget=forms.FileInput(attrs={
            'accept': '.xlsx,.xls',
            'class': 'form-control-file'
        })
    )
    
    class Meta:
        model = MarketplaceSale
        fields = ['product_offer']
        widgets = {
            'product_offer': forms.Select(attrs={'class': 'form-control'})
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # فقط عرضه‌های فعال نمایش داده شوند
        self.fields['product_offer'].queryset = ProductOffer.objects.filter(
            status__in=['active', 'sold']
        ).select_related('product', 'warehouse_receipt')