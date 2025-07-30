from django import forms
from django.forms import inlineformset_factory
from django_jalali.forms import jDateField
from django_jalali.forms.widgets import jDateInput
from .models import *

class ProductCategoryForm(forms.ModelForm):
    class Meta:
        model = ProductCategory
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام گروه کالایی'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'name': 'نام گروه کالایی',
            'description': 'توضیحات'
        }

class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = ['code', 'name', 'category', 'description', 'unit']
        widgets = {
            'code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد کالا'
            }),
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام کالا'
            }),
            'category': forms.Select(attrs={
                'class': 'form-control'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات کالا',
                'rows': 3
            }),
            'unit': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'واحد (کیلوگرم، تن، عدد و ...)'
            }),
        }
        labels = {
            'code': 'کد کالا',
            'name': 'نام کالا',
            'category': 'گروه کالایی',
            'description': 'توضیحات',
            'unit': 'واحد'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['category'].queryset = ProductCategory.objects.all()
        self.fields['category'].empty_label = "انتخاب کنید"

class WarehouseForm(forms.ModelForm):
    class Meta:
        model = Warehouse
        fields = ['name', 'address', 'manager', 'phone', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام انبار'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس انبار',
                'rows': 3
            }),
            'manager': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام مدیر انبار'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره تلفن'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'name': 'نام انبار',
            'address': 'آدرس',
            'manager': 'نام مدیر انبار',
            'phone': 'شماره تلفن',
            'description': 'توضیحات'
        }

class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ['supplier_type', 'company_name', 'national_id', 'full_name', 'personal_code', 'economic_code', 'phone', 'address', 'description']
        widgets = {
            'supplier_type': forms.Select(attrs={
                'class': 'form-control',
            }),
            'company_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام شرکت (برای حقوقی)'
            }),
            'national_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شناسه ملی (برای حقوقی)'
            }),
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام و نام خانوادگی (برای حقیقی)'
            }),
            'personal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد ملی (برای حقیقی)'
            }),
            'economic_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد اقتصادی'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره تلفن'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس',
                'rows': 3
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'supplier_type': 'نوع تامین کننده',
            'company_name': 'نام شرکت',
            'national_id': 'شناسه ملی',
            'full_name': 'نام و نام خانوادگی',
            'personal_code': 'کد ملی',
            'economic_code': 'کد اقتصادی',
            'phone': 'شماره تلفن',
            'address': 'آدرس',
            'description': 'توضیحات'
        }

class CustomerForm(forms.ModelForm):
    class Meta:
        model = Customer
        fields = ['customer_type', 'company_name', 'national_id', 'full_name', 'personal_code', 'economic_code', 'phone', 'address', 'description']  # اصلاح costumer_type به customer_type
        widgets = {
            'customer_type': forms.Select(attrs={
                'class': 'form-control',
            }),
            'company_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام شرکت (برای حقوقی)'
            }),
            'national_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شناسه ملی (برای حقوقی)'
            }),
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام و نام خانوادگی (برای حقیقی)'
            }),
            'personal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد ملی (برای حقیقی)'
            }),
            'economic_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد اقتصادی'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره تلفن'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس',
                'rows': 3
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'customer_type': 'نوع مشتری',  # اصلاح
            'company_name': 'نام شرکت',
            'national_id': 'شناسه ملی',
            'full_name': 'نام و نام خانوادگی',
            'personal_code': 'کد ملی',
            'economic_code': 'کد اقتصادی',
            'phone': 'شماره تلفن',
            'address': 'آدرس',
            'description': 'توضیحات'
        }

class ReceiverForm(forms.ModelForm):
    class Meta:
        model = Receiver
        fields = ['unique_id', 'receiver_type', 'company_name', 'national_id', 'full_name', 'personal_code', 'economic_code', 'phone', 'address', 'postal_code', 'description']
        widgets = {
            'unique_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شناسه یکتا'
            }),
            'receiver_type': forms.Select(attrs={
                'class': 'form-control',
            }),
            'company_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام شرکت (برای حقوقی)'
            }),
            'national_id': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شناسه ملی (برای حقوقی)'
            }),
            'full_name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام و نام خانوادگی (برای حقیقی)'
            }),
            'personal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد ملی (برای حقیقی)'
            }),
            'economic_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد اقتصادی'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره تلفن'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس',
                'rows': 3
            }),
            'postal_code': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'کد پستی'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }

class ShippingCompanyForm(forms.ModelForm):
    class Meta:
        model = ShippingCompany
        fields = ['name', 'contact_person', 'phone', 'email', 'address', 'description']
        widgets = {
            'name': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام شرکت حمل'
            }),
            'contact_person': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'نام شخص رابط'
            }),
            'phone': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره تلفن'
            }),
            'email': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس ایمیل'
            }),
            'address': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'آدرس',
                'rows': 3
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'name': 'نام شرکت',
            'contact_person': 'شخص رابط',
            'phone': 'شماره تلفن',
            'email': 'ایمیل',
            'address': 'آدرس',
            'description': 'توضیحات'
        }

class PurchaseProformaForm(forms.ModelForm):
    class Meta:
        model = PurchaseProforma
        fields = ['number', 'date', 'supplier', 'description']  # اصلاح فیلدها مطابق مدل
        widgets = {
            'number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره پیش‌فاکتور'
            }),
            'date': jDateInput(attrs={
                'class': 'form-control vjDateField'
            }),
            'supplier': forms.Select(attrs={
                'class': 'form-control'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'number': 'شماره پیش‌فاکتور',
            'date': 'تاریخ',
            'supplier': 'تامین‌کننده',
            'description': 'توضیحات'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['supplier'].queryset = Supplier.objects.all()
        self.fields['supplier'].empty_label = "انتخاب کنید"

class SalesProformaForm(forms.ModelForm):  # اصلاح نام از SaleProformaForm
    class Meta:
        model = SalesProforma  # اصلاح نام مدل
        fields = ['number', 'date', 'customer', 'description']  # اصلاح فیلدها مطابق مدل
        widgets = {
            'number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره پیش‌فاکتور'
            }),
            'date': jDateInput(attrs={
                'class': 'form-control vjDateField'
            }),
            'customer': forms.Select(attrs={
                'class': 'form-control'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'number': 'شماره پیش‌فاکتور',
            'date': 'تاریخ',
            'customer': 'مشتری',
            'description': 'توضیحات'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['customer'].queryset = Customer.objects.all()
        self.fields['customer'].empty_label = "انتخاب کنید"

class PurchaseProformaItemForm(forms.ModelForm):
    class Meta:
        model = PurchaseProformaItem
        fields = ['row_number', 'product', 'quantity', 'unit_price']  # اصلاح فیلدها مطابق مدل
        widgets = {
            'row_number': forms.NumberInput(attrs={'class': 'form-control'}),
            'product': forms.Select(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control'}),
        }

class SalesProformaItemForm(forms.ModelForm):  # اصلاح نام
    class Meta:
        model = SalesProformaItem  # اصلاح نام مدل
        fields = ['row_number', 'product', 'quantity', 'unit_price']  # اصلاح فیلدها مطابق مدل
        widgets = {
            'row_number': forms.NumberInput(attrs={'class': 'form-control'}),
            'product': forms.Select(attrs={'class': 'form-control'}),
            'quantity': forms.NumberInput(attrs={'class': 'form-control'}),
            'unit_price': forms.NumberInput(attrs={'class': 'form-control'}),
        }

# Formsets برای آیتم‌های پیش‌فاکتور
PurchaseProformaItemFormSet = inlineformset_factory(
    PurchaseProforma, 
    PurchaseProformaItem, 
    form=PurchaseProformaItemForm,
    extra=1, 
    can_delete=True
)

SalesProformaItemFormSet = inlineformset_factory(  # اصلاح نام
    SalesProforma,  # اصلاح نام مدل
    SalesProformaItem,  # اصلاح نام مدل
    form=SalesProformaItemForm,
    extra=1, 
    can_delete=True
)

class WarehouseDeliveryOrderForm(forms.ModelForm):
    class Meta:
        model = WarehouseDeliveryOrder
        fields = ['number', 'issue_date', 'validity_date', 'warehouse', 'sales_proforma', 'shipping_company', 'description']
        widgets = {
            'number': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'شماره حواله'
            }),
            'issue_date': jDateInput(attrs={
                'class': 'form-control vjDateField'
            }),
            'validity_date': jDateInput(attrs={
                'class': 'form-control vjDateField'
            }),
            'warehouse': forms.Select(attrs={
                'class': 'form-control'
            }),
            'sales_proforma': forms.Select(attrs={
                'class': 'form-control'
            }),
            'shipping_company': forms.Select(attrs={
                'class': 'form-control'
            }),
            'description': forms.Textarea(attrs={
                'class': 'form-control',
                'placeholder': 'توضیحات',
                'rows': 3
            }),
        }
        labels = {
            'number': 'شماره حواله',
            'issue_date': 'تاریخ صدور',
            'validity_date': 'تاریخ اعتبار',
            'warehouse': 'انبار',
            'sales_proforma': 'پیش فاکتور فروش',
            'shipping_company': 'شرکت حمل',
            'description': 'توضیحات'
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['warehouse'].queryset = Warehouse.objects.all()
        self.fields['warehouse'].empty_label = "انتخاب انبار"
        self.fields['sales_proforma'].queryset = SalesProforma.objects.all()
        self.fields['sales_proforma'].empty_label = "انتخاب پیش فاکتور"
        self.fields['shipping_company'].queryset = ShippingCompany.objects.all()
        self.fields['shipping_company'].empty_label = "انتخاب شرکت حمل"