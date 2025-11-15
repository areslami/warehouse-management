// جاوااسکریپت ساده برای فروش بازارگاه

document.addEventListener('DOMContentLoaded', function() {
    console.log('Marketplace Simple JS loaded');
    
    // تابع فرمت کردن اعداد ساده
    function formatNumber(value) {
        if (!value || value === '') return '';
        return parseFloat(value).toLocaleString('fa-IR');
    }
    
    // پیدا کردن فیلدهای عددی
    const numericFields = document.querySelectorAll(
        'input[name*="purchase_weight"], input[name*="paid_amount"], ' +
        'input[name*="offer_weight"], input[name*="unit_price"]'
    );
    
    numericFields.forEach(function(field) {
        // تنظیم استایل
        field.style.textAlign = 'left';
        field.style.direction = 'ltr';
        field.style.fontFamily = 'Courier New, monospace';
        
        // event listener برای فرمت در focus out
        field.addEventListener('blur', function() {
            if (this.value) {
                // حذف کاراکترهای غیرعددی و فرمت مجدد
                let cleanValue = this.value.replace(/[^\d.]/g, '');
                if (cleanValue && !isNaN(cleanValue)) {
                    this.value = cleanValue;
                }
            }
        });
        
        // جلوگیری از ورود کاراکترهای غیرعددی
        field.addEventListener('keypress', function(e) {
            // اجازه دادن به اعداد، نقطه، و کلیدهای کنترلی
            if (!/[\d.]/.test(e.key) && 
                !['Backspace', 'Delete', 'Tab', 'Enter', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();
            }
        });
    });
    
    // محاسبه خودکار در صفحه عرضه کالا
    function calculateTotal() {
        const weightField = document.querySelector('input[name="offer_weight"]');
        const priceField = document.querySelector('input[name="unit_price"]');
        
        if (weightField && priceField) {
            const weight = parseFloat(weightField.value) || 0;
            const price = parseFloat(priceField.value) || 0;
            const total = weight * price;
            
            // نمایش نتیجه
            console.log(`محاسبه: ${weight} × ${price} = ${total}`);
        }
    }
    
    // اضافه کردن listener برای محاسبه خودکار
    const calculationFields = document.querySelectorAll(
        'input[name="offer_weight"], input[name="unit_price"]'
    );
    
    calculationFields.forEach(function(field) {
        field.addEventListener('input', calculateTotal);
        field.addEventListener('blur', calculateTotal);
    });
    
    console.log('Marketplace Simple JS setup complete');
});