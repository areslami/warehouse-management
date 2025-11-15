// جاوااسکریپت مخصوص صفحه عرضه کالا

document.addEventListener('DOMContentLoaded', function() {
    console.log('Product Offer Admin JS loaded');
    
    // متغیرهای سراسری
    let calculationDiv = null;
    let isInitialized = false;
    
    // تابع محاسبه خودکار مبلغ کل
    function updateTotalPrice() {
        const weightField = document.querySelector('input[name="offer_weight"]');
        const priceField = document.querySelector('input[name="unit_price"]');
        
        if (!weightField || !priceField) return;
        
        const weight = parseFloat(weightField.value.replace(/[^\d.]/g, '')) || 0;
        const price = parseFloat(priceField.value.replace(/[^\d.]/g, '')) || 0;
        const total = weight * price;
        
        // به‌روزرسانی نمایش محاسبات
        const amountElement = document.querySelector('.total-calculation .amount');
        const weightDisplay = document.getElementById('weight-display');
        const priceDisplay = document.getElementById('price-display');
        const totalDisplay = document.getElementById('total-display');
        
        if (amountElement) {
            amountElement.textContent = total.toLocaleString('en-US') + ' ریال';
        }
        
        if (weightDisplay) {
            weightDisplay.textContent = weight.toLocaleString('en-US');
        }
        
        if (priceDisplay) {
            priceDisplay.textContent = price.toLocaleString('en-US');
        }
        
        if (totalDisplay) {
            totalDisplay.textContent = total.toLocaleString('en-US');
        }
        
        console.log(`محاسبه: ${weight} × ${price} = ${total}`);
    }
    
    // تابع اضافه کردن نمایش زنده محاسبات
    function addLiveCalculationDisplay() {
        if (calculationDiv) return; // جلوگیری از تکرار
        
        const priceFieldContainer = document.querySelector('.field-unit_price');
        if (!priceFieldContainer) return;
        
        // ایجاد div برای نمایش محاسبات
        calculationDiv = document.createElement('div');
        calculationDiv.className = 'total-calculation';
        calculationDiv.innerHTML = `
            <div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 15px 0;">
                <div style="font-weight: bold; margin-bottom: 8px; color: #155724;">
                    <i class="fas fa-calculator"></i> محاسبه خودکار مبلغ کل:
                </div>
                <div class="amount" style="font-size: 20px; font-weight: bold; color: #155724; direction: ltr; margin: 10px 0;">
                    0 ریال
                </div>
                <div style="font-size: 12px; color: #155724; margin-top: 5px;">
                    <span id="weight-display">0</span> تن × 
                    <span id="price-display">0</span> ریال = 
                    <span id="total-display">0</span> ریال
                </div>
            </div>
        `;
        
        // اضافه کردن بعد از فیلد قیمت
        priceFieldContainer.parentNode.insertBefore(calculationDiv, priceFieldContainer.nextSibling);
    }
    
    // تابع اضافه کردن event listener ها
    function setupEventListeners() {
        const weightField = document.querySelector('input[name="offer_weight"]');
        const priceField = document.querySelector('input[name="unit_price"]');
        
        if (weightField) {
            // حذف listener های قبلی
            weightField.removeEventListener('input', updateTotalPrice);
            weightField.removeEventListener('blur', updateTotalPrice);
            
            // اضافه کردن listener های جدید
            weightField.addEventListener('input', updateTotalPrice);
            weightField.addEventListener('blur', updateTotalPrice);
        }
        
        if (priceField) {
            // حذف listener های قبلی
            priceField.removeEventListener('input', updateTotalPrice);
            priceField.removeEventListener('blur', updateTotalPrice);
            
            // اضافه کردن listener های جدید
            priceField.addEventListener('input', updateTotalPrice);
            priceField.addEventListener('blur', updateTotalPrice);
        }
    }
    
    // تابع بهبود نمایش رسید انبار در dropdown
    function improveReceiptDisplay() {
        const receiptField = document.querySelector('select[name="warehouse_receipt"]');
        if (!receiptField) return;
        
        // بهبود استایل
        receiptField.style.direction = 'rtl';
        receiptField.style.textAlign = 'right';
        receiptField.style.width = '100%';
        
        // اضافه کردن event listener برای نمایش بهتر انتخاب شده
        receiptField.addEventListener('change', function() {
            const selectedOption = this.options[this.selectedIndex];
            if (selectedOption.value) {
                console.log('کوتاژ انتخاب شده:', selectedOption.textContent);
                
                // نمایش مناسب در فیلد
                selectedOption.style.fontWeight = 'bold';
                selectedOption.style.color = '#0066cc';
            }
        });
        
        // بهبود نمایش گزینه‌ها
        Array.from(receiptField.options).forEach(option => {
            if (option.value) {
                option.title = `جزئیات: ${option.textContent}`;
                option.style.padding = '5px';
                option.style.direction = 'rtl';
            }
        });
    }
    
    // تابع اضافه کردن راهنما به فیلدها
    function addFieldHelpers() {
        // راهنما برای فیلد وزن
        const weightField = document.querySelector('.field-offer_weight');
        if (weightField && !weightField.querySelector('.field-help')) {
            const weightHelp = document.createElement('div');
            weightHelp.className = 'field-help';
            weightHelp.innerHTML = '💡 وزن را به تن وارد کنید (مثال: 1,250.5)';
            weightField.appendChild(weightHelp);
        }
        
        // راهنما برای فیلد قیمت
        const priceField = document.querySelector('.field-unit_price');
        if (priceField && !priceField.querySelector('.field-help')) {
            const priceHelp = document.createElement('div');
            priceHelp.className = 'field-help';
            priceHelp.innerHTML = '💡 قیمت را به ریال وارد کنید (مثال: 1,500,000)';
            priceField.appendChild(priceHelp);
        }
    }
    
    // تابع اضافه کردن validation
    function addValidation() {
        const form = document.querySelector('form');
        if (!form || form.hasValidationListener) return;
        
        form.hasValidationListener = true; // جلوگیری از تکرار
        
        form.addEventListener('submit', function(e) {
            const weightField = document.querySelector('input[name="offer_weight"]');
            const priceField = document.querySelector('input[name="unit_price"]');
            const receiptField = document.querySelector('select[name="warehouse_receipt"]');
            
            let hasError = false;
            let errorMessage = '';
            
            // بررسی رسید انبار
            if (!receiptField || !receiptField.value) {
                hasError = true;
                errorMessage += '• رسید انبار (کوتاژ) را انتخاب کنید\n';
            }
            
            // بررسی وزن
            const weight = parseFloat((weightField?.value || '').replace(/[^\d.]/g, ''));
            if (!weight || weight <= 0) {
                hasError = true;
                errorMessage += '• وزن عرضه باید بیشتر از صفر باشد\n';
            }
            
            // بررسی قیمت
            const price = parseFloat((priceField?.value || '').replace(/[^\d.]/g, ''));
            if (!price || price <= 0) {
                hasError = true;
                errorMessage += '• قیمت واحد باید بیشتر از صفر باشد\n';
            }
            
            if (hasError) {
                e.preventDefault();
                alert('لطفاً خطاهای زیر را برطرف کنید:\n\n' + errorMessage);
                return false;
            }
        });
    }
    
    // تابع بهبود UI
    function improveUserInterface() {
        // اضافه کردن آیکون به عنوان صفحه
        const title = document.querySelector('h1');
        if (title && title.textContent.includes('عرضه کالا') && !title.querySelector('i')) {
            title.innerHTML = '<i class="fas fa-store"></i> ' + title.textContent;
        }
        
        // بهبود نمایش فیلدهای مهم
        const importantFields = [
            'warehouse_receipt', 'marketplace_product', 
            'offer_weight', 'unit_price'
        ];
        
        importantFields.forEach(fieldName => {
            const field = document.querySelector(`[name="${fieldName}"]`);
            if (field && !field.classList.contains('important-field')) {
                field.classList.add('important-field');
                field.style.border = '2px solid #007cba';
                field.style.backgroundColor = '#f8f9fa';
                field.style.transition = 'all 0.3s ease';
            }
        });
    }
    
    // تابع اصلی اولیه‌سازی
    function initializeProductOfferPage() {
        if (isInitialized) return; // جلوگیری از تکرار
        
        console.log('Initializing Product Offer page...');
        isInitialized = true;
        
        try {
            improveReceiptDisplay();
            addFieldHelpers();
            addLiveCalculationDisplay();
            setupEventListeners();
            addValidation();
            improveUserInterface();
            
            // محاسبه اولیه
            setTimeout(updateTotalPrice, 100);
            
            console.log('Product Offer page initialization complete');
        } catch (error) {
            console.error('Error initializing Product Offer page:', error);
        }
    }
    
    // شروع اولیه‌سازی با تاخیر کوتاه
    setTimeout(initializeProductOfferPage, 200);
});