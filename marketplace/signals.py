# marketplace/signals.py

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import MarketplacePurchase, MarketplacePurchaseDetail, DeliveryAddress


@receiver(post_save, sender=MarketplacePurchase)
def create_purchase_detail(sender, instance, created, **kwargs):
    """ایجاد خودکار جزئیات خرید بعد از ایجاد خرید"""
    if created:
        MarketplacePurchaseDetail.objects.get_or_create(
            purchase=instance,
            defaults={
                'agreement_description': f'خرید {instance.purchase_type} - {instance.buyer_name}'
            }
        )


@receiver([post_save, post_delete], sender=MarketplacePurchase)
def update_sale_weights(sender, instance, **kwargs):
    """به‌روزرسانی خودکار وزن‌های فروش بعد از تغییر خریدها"""
    try:
        if instance.marketplace_sale:
            instance.marketplace_sale.calculate_weights()
    except Exception as e:
        # Log the error but don't break the operation
        import logging
        logger = logging.getLogger(__name__)
        logger.error(f"Error updating sale weights: {str(e)}")


@receiver(post_save, sender=DeliveryAddress)
def validate_delivery_address(sender, instance, created, **kwargs):
    """اعتبارسنجی و تنظیم خودکار فیلدهای آدرس تحویل"""
    if created:
        # اطمینان از تطابق اطلاعات با خرید والد
        purchase = instance.purchase_detail.purchase
        
        # به‌روزرسانی فیلدهای تطابق در صورت نیاز
        if not instance.code:
            instance.code = purchase.purchase_id
            
        if not instance.buyer_name:
            instance.buyer_name = purchase.buyer_name
            
        if not instance.buyer_mobile:
            instance.buyer_mobile = purchase.buyer_mobile
            
        if not instance.buyer_national_id:
            instance.buyer_national_id = purchase.buyer_national_id
            
        # تنظیم شناسه تخصیص یکتا در صورت نیاز
        if not instance.assignment_id:
            instance.assignment_id = f"ADDR_{purchase.purchase_id}_{instance.id}"
            
        # ذخیره تغییرات
        if any([
            not instance.code, not instance.buyer_name, 
            not instance.buyer_mobile, not instance.assignment_id
        ]):
            DeliveryAddress.objects.filter(id=instance.id).update(
                code=instance.code,
                buyer_name=instance.buyer_name,
                buyer_mobile=instance.buyer_mobile,
                buyer_national_id=instance.buyer_national_id,
                assignment_id=instance.assignment_id
            )


@receiver(post_delete, sender=DeliveryAddress)
def cleanup_empty_purchase_details(sender, instance, **kwargs):
    """حذف جزئیات خرید در صورت عدم وجود آدرس تحویل"""
    purchase_detail = instance.purchase_detail
    
    # اگر این آخرین آدرس تحویل بود و جزئیات خرید خالی است
    if not purchase_detail.delivery_addresses.exists():
        if not purchase_detail.agreement_description.strip():
            # می‌توانیم جزئیات خرید را حذف کنیم (اختیاری)
            # purchase_detail.delete()
            pass


# Signal برای اعلان‌رسانی تغییرات مهم
@receiver(post_save, sender=MarketplacePurchase)
def log_purchase_changes(sender, instance, created, **kwargs):
    """ثبت تغییرات خریدها در لاگ سیستم"""
    import logging
    logger = logging.getLogger('marketplace.purchases')
    
    if created:
        logger.info(
            f"New purchase created: {instance.purchase_id} by {instance.buyer_name} "
            f"for {instance.purchase_weight} tons of {instance.marketplace_sale.product_title}"
        )
    else:
        logger.info(
            f"Purchase updated: {instance.purchase_id} - {instance.buyer_name}"
        )


@receiver(post_save, sender=DeliveryAddress)  
def log_address_changes(sender, instance, created, **kwargs):
    """ثبت تغییرات آدرس‌های تحویل در لاگ سیستم"""
    import logging
    logger = logging.getLogger('marketplace.deliveries')
    
    if created:
        logger.info(
            f"New delivery address created: {instance.assignment_id} "
            f"for {instance.recipient_name} in {instance.city}, {instance.province}"
        )


# اتصال سیگنال‌ها (این خط مهم است!)
def connect_signals():
    """اتصال سیگنال‌ها - باید در apps.py فراخوانی شود"""
    pass  # سیگنال‌ها خودکار متصل می‌شوند