document.addEventListener('DOMContentLoaded', function() {
    // منتظر بارگذاری کامل صفحه باش
    setTimeout(function() {
        setupReceiverAutoFill();
    }, 1000);
    
    // برای آیتم‌های جدید که اضافه میشن
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('add-row')) {
            setTimeout(setupReceiverAutoFill, 500);
        }
    });
});

function setupReceiverAutoFill() {
    // پیدا کردن همه dropdown های گیرنده
    const receiverSelects = document.querySelectorAll('select[name*="receiver"][name*="items"]');
    
    receiverSelects.forEach(function(select) {
        // چک کن که listener قبلاً اضافه نشده باشه
        if (!select.hasAttribute('data-listener-added')) {
            select.setAttribute('data-listener-added', 'true');
            select.addEventListener('change', function() {
                handleReceiverChange(this);
            });
        }
    });
}

function handleReceiverChange(receiverSelect) {
    const receiverId = receiverSelect.value;
    
    if (!receiverId) {
        return;
    }
    
    // پیدا کردن ردیف مربوطه
    const row = receiverSelect.closest('tr');
    if (!row) {
        return;
    }
    
    // پیدا کردن فیلدهای مربوط به اطلاعات گیرنده
    const addressField = row.querySelector('textarea[name*="receiver_address"]');
    const phoneField = row.querySelector('input[name*="receiver_phone"]');
    const postalCodeField = row.querySelector('input[name*="receiver_postal_code"]');
    const uniqueIdField = row.querySelector('input[name*="receiver_unique_id"]');
    
    // درخواست API برای دریافت اطلاعات گیرنده
    fetch(`/warehouse/api/receiver/${receiverId}/`)
    .then(response => {
        if (!response.ok) {
            throw new Error('خطا در دریافت اطلاعات');
        }
        return response.json();
    })
    .then(data => {
        // پر کردن فیلدها با اطلاعات دریافتی
        if (addressField && data.address) {
            addressField.value = data.address;
        }
        if (phoneField && data.phone) {
            phoneField.value = data.phone;
        }
        if (postalCodeField && data.postal_code) {
            postalCodeField.value = data.postal_code;
        }
        if (uniqueIdField && data.unique_id) {
            uniqueIdField.value = data.unique_id;
        }
        
        // نمایش پیام موفقیت
        console.log('اطلاعات گیرنده با موفقیت بارگذاری شد');
    })
    .catch(error => {
        console.error('خطا در دریافت اطلاعات گیرنده:', error);
        // در صورت خطا، فیلدها را خالی نگذاریم
    });
}