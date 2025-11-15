// جاوااسکریپت مخصوص فرم رسید انبار

document.addEventListener('DOMContentLoaded', function() {
    console.log('Warehouse Receipt Admin JS loaded');
    
    // تابع نمایش/مخفی کردن فیلد شماره کوتاژ
    function toggleCottageField() {
        const receiptTypeField = document.querySelector('select[name="receipt_type"]');
        const cottageFieldRow = document.querySelector('.field-cottage_number');
        const cottageInput = document.querySelector('input[name="cottage_number"]');
        
        if (!receiptTypeField || !cottageFieldRow) {
            console.log('Fields not found');
            return;
        }
        
        const receiptType = receiptTypeField.value;
        console.log('Receipt type:', receiptType);
        
        // نمایش فیلد کوتاژ برای کوتاژ‌وارداتی و عاملیت توزیع
        if (receiptType === 'import_cottage' || receiptType === 'distribution_agency') {
            cottageFieldRow.style.display = 'block';
            cottageFieldRow.classList.remove('hidden');
            
            // اضافه کردن کلاس برای استایل بر اساس نوع
            cottageFieldRow.classList.remove('receipt-type-import_cottage', 'receipt-type-distribution_agency', 'receipt-type-domestic_purchase');
            cottageFieldRow.classList.add(`receipt-type-${receiptType}`);
            
            // اضافه کردن راهنما مخصوص هر نوع
            let helpText = '';
            if (receiptType === 'import_cottage') {
                helpText = 'برای رسیدهای کوتاژ‌وارداتی، شماره کوتاژ را وارد کنید.';
            } else if (receiptType === 'distribution_agency') {
                helpText = 'برای رسیدهای عاملیت توزیع، شماره کوتاژ را وارد کنید.';
            }
            
            // حذف راهنمای قبلی و اضافه کردن جدید
            const existingHelp = cottageFieldRow.querySelector('.receipt-type-help');
            if (existingHelp) {
                existingHelp.remove();
            }
            
            if (helpText) {
                const helpDiv = document.createElement('div');
                helpDiv.className = 'receipt-type-help';
                helpDiv.innerHTML = helpText;
                cottageFieldRow.appendChild(helpDiv);
            }
        } else {
            // مخفی کردن فیلد برای خرید داخلی
            cottageFieldRow.style.display = 'none';
            cottageFieldRow.classList.add('hidden');
            
            // پاک کردن مقدار فیلد
            if (cottageInput) {
                cottageInput.value = '';
            }
            
            // حذف راهنما
            const existingHelp = cottageFieldRow.querySelector('.receipt-type-help');
            if (existingHelp) {
                existingHelp.remove();
            }
            
            // تغییر کلاس استایل
            cottageFieldRow.classList.remove('receipt-type-import_cottage', 'receipt-type-distribution_agency');
            cottageFieldRow.classList.add('receipt-type-domestic_purchase');
        }
    }
    
    // تابع اضافه کردن راهنما برای شماره خودکار
    function addAutoNumberInfo() {
        const tempNumberField = document.querySelector('.field-temp_number');
        const tempNumberInput = document.querySelector('input[name="temp_number"]');
        
        if (tempNumberField && tempNumberInput && tempNumberInput.readOnly) {
            if (!tempNumberField.querySelector('.auto-number-info')) {
                const infoDiv = document.createElement('div');
                infoDiv.className = 'auto-number-info';
                infoDiv.innerHTML = 'شماره رسید به صورت خودکار تولید می‌شود (فرمت: R + سال‌ماه + شماره سریال)';
                tempNumberField.appendChild(infoDiv);
            }
        }
    }
    
    // اجرای تابع‌ها
    const receiptTypeField = document.querySelector('select[name="receipt_type"]');
    if (receiptTypeField) {
        // listener برای تغییر نوع رسید
        receiptTypeField.addEventListener('change', toggleCottageField);
        
        // اجرای اولیه
        setTimeout(toggleCottageField, 100);
    }
    
    // اضافه کردن راهنما برای شماره خودکار
    setTimeout(addAutoNumberInfo, 200);
    
    // رنگ‌بندی فرم بر اساس نوع رسید
    function updateFormStyling() {
        const receiptTypeField = document.querySelector('select[name="receipt_type"]');
        const mainForm = document.querySelector('.form-horizontal, form');
        
        if (receiptTypeField && mainForm) {
            const receiptType = receiptTypeField.value;
            
            // حذف کلاس‌های قبلی
            mainForm.classList.remove('receipt-type-import_cottage', 'receipt-type-distribution_agency', 'receipt-type-domestic_purchase');
            
            // اضافه کردن کلاس جدید
            if (receiptType) {
                mainForm.classList.add(`receipt-type-${receiptType}`);
            }
        }
    }
    
    // اعمال استایل اولیه
    setTimeout(updateFormStyling, 100);
    
    // listener برای تغییر استایل
    if (receiptTypeField) {
        receiptTypeField.addEventListener('change', updateFormStyling);
    }
    
    console.log('Warehouse Receipt Admin JS setup complete');
});