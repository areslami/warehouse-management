// لود خودکار اطلاعات گیرنده هنگام انتخاب
document.addEventListener('DOMContentLoaded', function() {
    console.log('Delivery order inline JS loaded');
    
    // تابع لود اطلاعات گیرنده
    function loadReceiverData(receiverSelect, rowPrefix) {
        const receiverId = receiverSelect.value;
        console.log('Loading receiver data for ID:', receiverId, 'Row:', rowPrefix);
        
        if (!receiverId || receiverId === '') {
            console.log('No receiver selected');
            return;
        }
        
        // درخواست AJAX برای گرفتن اطلاعات گیرنده - URL جدید
        fetch(`/warehouse/receiver-data/${receiverId}/`)
            .then(response => {
                console.log('Response status:', response.status);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log('Receiver data received:', data);
                
                if (data.error) {
                    console.error('API Error:', data.error);
                    alert('خطا: ' + data.error);
                    return;
                }
                
                // پر کردن فیلدها
                const nameField = document.querySelector(`[name="${rowPrefix}-receiver_name"]`);
                const nationalIdField = document.querySelector(`[name="${rowPrefix}-receiver_national_id"]`);
                const phoneField = document.querySelector(`[name="${rowPrefix}-receiver_phone"]`);
                const addressField = document.querySelector(`[name="${rowPrefix}-receiver_address"]`);
                const postalCodeField = document.querySelector(`[name="${rowPrefix}-receiver_postal_code"]`);
                const uniqueIdField = document.querySelector(`[name="${rowPrefix}-receiver_unique_id"]`);
                
                console.log('Found fields:', {
                    name: !!nameField,
                    nationalId: !!nationalIdField,
                    phone: !!phoneField,
                    address: !!addressField,
                    postalCode: !!postalCodeField,
                    uniqueId: !!uniqueIdField
                });
                
                // پر کردن فیلدها
                if (nameField) {
                    nameField.value = data.name || '';
                    console.log('Set name:', data.name);
                }
                if (nationalIdField) {
                    nationalIdField.value = data.national_id || '';
                    console.log('Set national_id:', data.national_id);
                }
                if (phoneField) {
                    phoneField.value = data.phone || '';
                    console.log('Set phone:', data.phone);
                }
                if (addressField) {
                    addressField.value = data.address || '';
                    console.log('Set address:', data.address);
                }
                if (postalCodeField) {
                    postalCodeField.value = data.postal_code || '';
                    console.log('Set postal_code:', data.postal_code);
                }
                if (uniqueIdField) {
                    uniqueIdField.value = data.unique_id || '';
                    console.log('Set unique_id:', data.unique_id);
                }
                
                console.log('All fields filled successfully!');
            })
            .catch(error => {
                console.error('خطا در لود اطلاعات گیرنده:', error);
                alert('خطا در بارگذاری اطلاعات گیرنده: ' + error.message);
            });
    }
    
    // اضافه کردن listener به همه فیلدهای انتخاب گیرنده
    function setupReceiverListeners() {
        const receiverSelects = document.querySelectorAll('select[name*="receiver"][name$="receiver"]');
        console.log('Found receiver selects:', receiverSelects.length);
        
        receiverSelects.forEach((select, index) => {
            console.log(`Setting up listener for select ${index}: ${select.name}`);
            
            // حذف listener قبلی
            if (select._receiverChangeHandler) {
                select.removeEventListener('change', select._receiverChangeHandler);
            }
            
            // تعریف handler جدید
            select._receiverChangeHandler = function() {
                console.log('Receiver changed:', this.value);
                const nameParts = this.name.split('-');
                const rowPrefix = nameParts.slice(0, -1).join('-');
                console.log('Row prefix:', rowPrefix);
                loadReceiverData(this, rowPrefix);
            };
            
            // اضافه کردن listener جدید
            select.addEventListener('change', select._receiverChangeHandler);
        });
    }
    
    // اجرای اولیه
    setTimeout(setupReceiverListeners, 500);
    
    // اجرا مجدد هنگام اضافه شدن ردیف جدید
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                setTimeout(() => {
                    console.log('DOM changed, re-setting up listeners');
                    setupReceiverListeners();
                }, 1000);
            }
        });
    });
    
    const inlineContainer = document.querySelector('.inline-group') || document.querySelector('.tabular');
    if (inlineContainer) {
        console.log('Setting up mutation observer on:', inlineContainer);
        observer.observe(inlineContainer, {
            childList: true,
            subtree: true
        });
    } else {
        console.log('Inline container not found, trying body');
        // fallback: observe whole body
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
});