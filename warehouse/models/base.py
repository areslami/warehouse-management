from django.db import models

class ProductCategory(models.Model):
    """گروه کالایی"""
    name = models.CharField(max_length=100, verbose_name='نام گروه')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    class Meta:
        verbose_name = 'گروه کالایی'
        verbose_name_plural = 'گروه‌های کالایی'
        db_table = 'product_categories'
    
    def __str__(self):
        return self.name

class Product(models.Model):
    """کالا"""
    name = models.CharField(max_length=200, verbose_name='نام کالا')
    code = models.CharField(max_length=50, unique=True, verbose_name='کد کالا')
    category = models.ForeignKey(ProductCategory, on_delete=models.CASCADE, verbose_name='گروه کالایی')
    unit = models.CharField(max_length=20, verbose_name='واحد اندازه‌گیری')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    class Meta:
        verbose_name = 'کالا'
        verbose_name_plural = 'کالاها'
        db_table = 'products'
    
    def __str__(self):
        return f'{self.name} ({self.code})'

class Warehouse(models.Model):
    """انبار"""
    name = models.CharField(max_length=100, verbose_name='نام انبار')
    address = models.TextField(verbose_name='آدرس')
    manager = models.CharField(max_length=100, verbose_name='مدیر انبار')
    phone = models.CharField(max_length=20, verbose_name='تلفن')
    description = models.TextField(blank=True, verbose_name='توضیحات')
    
    class Meta:
        verbose_name = 'انبار'
        verbose_name_plural = 'انبارها'
        db_table = 'warehouses'
    
    def __str__(self):
        return self.name