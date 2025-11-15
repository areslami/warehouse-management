// جاوااسکریپت برای پردازش جداکننده هزارگان

document.addEventListener('DOMContentLoaded', function() {
    console.log('Thousand Separator JS loaded');
    
    // تابع اصلی برای فرمت کردن اعداد
    function formatNumber(value) {
        if (!value || value === '') return '';
        
        // حذف کاراکترهای غیرعددی به جز نقطه
        let numStr = value.toString().replace(/[^\d.]/g, '');
        
        // تبدیل به عدد و برگرداندن با جداکننده
        let num = parseFloat(numStr);
        if (isNaN(num)) return '';
        
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        });
    }
    
    // تابع برای پاک کردن فرمت و گرفتن عدد خام
    function unformatNumber(value) {
        if (!value || value === '') return '';
        return value.toString().replace(/[^\d.]/g, '');
    }
    
    // تابع اضافه کردن event listener به فیلدها
    function setupThousandSeparator() {
        const inputs = document.querySelectorAll('.thousand-separator-input');
        
        inputs.forEach(function(input) {
            // فرمت اولیه مقدار موجود
            if (input.value) {
                input.value = formatNumber(input.value);
            }
            
            // event listener برای وقتی که کاربر تایپ می‌کند
            input.addEventListener('input', function(e) {
                let cursorPosition = e.target.selectionStart;
                let oldValue = e.target.value;
                let oldLength = oldValue.length;
                
                // فرمت کردن مقدار جدید
                let newValue = formatNumber(unformatNumber(oldValue));
                e.target.value = newValue;
                
                // حفظ موقعیت کرسور
                let newLength = newValue.length;
                let newCursorPosition = cursorPosition + (newLength - oldLength);
                e.target.setSelectionRange(newCursorPosition, newCursorPosition);
            });
            
            // event listener برای وقتی که فیلد focus می‌شود
            input.addEventListener('focus', function(e) {
                // می‌توانید اینجا رفتار خاصی برای focus تعریف کنید
                e.target.select(); // انتخاب کل متن
            });
            
            // event listener برای وقتی که فیلد focus را از دست می‌دهد
            input.addEventListener('blur', function(e) {
                if (e.target.value) {
                    e.target.value = formatNumber(unformatNumber(e.target.value));
                }
                
                // فراخوانی تابع محاسبه خودکار اگر در صفحه عرضه باشیم
                calculateTotal();
            });
            
            // مدیریت paste
            input.addEventListener('paste', function(e) {
                setTimeout(function() {
                    let value = unformatNumber(e.target.value);
                    e.target.value = formatNumber(value);
                    calculateTotal();
                }, 10);
            });
        });
    }
    
    // تابع محاسبه خودکار مبلغ کل در صفحه عرضه
    function calculateTotal() {
        const weightField = document.querySelector('input[name="offer_weight"]');
        const priceField = document.querySelector('input[name="unit_price"]');
        const totalDisplay = document.querySelector('.total-calculation .amount');
        
        if (weightField && priceField) {
            const weight = parseFloat(unformatNumber(weightField.value)) || 0;
            const price = parseFloat(unformatNumber(priceField.value)) || 0;
            const total = weight * price;
            
            if (totalDisplay) {
                totalDisplay.textContent = formatNumber(total) + ' ریال';
            }
            
            // نمایش محاسبه در کنسول برای debug
            console.log(`وزن: ${weight}, قیمت: ${price}, کل: ${total}`);
        }
    }
    
    // تابع برای اضافه کردن نمایش محاسبه زنده
    function addLiveCalculation() {
        const weightField = document.querySelector('input[name="offer_weight"]');
        const priceField = document.querySelector('input[name="unit_price"]');
        
        if (weightField && priceField) {
            // ایجاد div برای نمایش محاسبه
            const calculationDiv = document.createElement('div');
            calculationDiv.className = 'total-calculation';
            calculationDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">محاسبه خودکار:</div>
                <div class="amount">0 ریال</div>
                <div style="font-size: 12px; color: #666; margin-top: 5px;">
                    وزن × قیمت واحد = مبلغ کل
                </div>
            `;
            
            // اضافه کردن بعد از فیلد قیمت
            const priceFieldContainer = priceField.closest('.form-row') || priceField.parentNode;
            if (priceFieldContainer && priceFieldContainer.parentNode) {
                priceFieldContainer.parentNode.insertBefore(calculationDiv, priceFieldContainer.nextSibling);
            }
            
            // محاسبه اولیه
            calculateTotal();
        }
    }
    
    // اجرای تابع‌ها
    setupThousandSeparator();
    
    // اضافه کردن محاسبه زنده بعد از کمی تاخیر
    setTimeout(addLiveCalculation, 500);
    
    // مدیریت فرم‌های inline django
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-row')) {
            // وقتی ردیف جدید اضافه می‌شود
            setTimeout(setupThousandSeparator, 100);
        }
    });
    
    // مدیریت فرم submit برای حذف فرمت قبل از ارسال
    document.addEventListener('submit', function(e) {
        const inputs = document.querySelectorAll('.thousand-separator-input');
        inputs.forEach(function(input) {
            // حذف فرمت و ذخیره عدد خام
            input.value = unformatNumber(input.value);
        });
    });
    
    console.log('Thousand Separator JS setup complete');
});