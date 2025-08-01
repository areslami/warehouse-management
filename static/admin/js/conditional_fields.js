document.addEventListener('DOMContentLoaded', function() {
    // Function to toggle field visibility based on type selection
    function toggleFields(typeFieldName, typeValue) {
        const legalFieldsets = document.querySelectorAll('.legal-fields');
        const naturalFieldsets = document.querySelectorAll('.natural-fields');
        
        if (typeValue === 'legal') {
            // Show legal fields, hide natural fields
            legalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'block';
            });
            naturalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'none';
            });
        } else if (typeValue === 'natural') {
            // Show natural fields, hide legal fields
            naturalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'block';
            });
            legalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'none';
            });
        } else {
            // Show both if no type selected (default state)
            legalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'block';
            });
            naturalFieldsets.forEach(fieldset => {
                fieldset.style.display = 'block';
            });
        }
    }

    // Function to setup event listeners for a type field
    function setupTypeField(fieldName) {
        const typeField = document.querySelector(`#id_${fieldName}`);
        if (typeField) {
            // Initial setup on page load
            toggleFields(fieldName, typeField.value);
            
            // Setup change event listener
            typeField.addEventListener('change', function() {
                toggleFields(fieldName, this.value);
            });
        }
    }

    // Setup for different model types
    // Supplier
    setupTypeField('supplier_type');
    
    // Customer  
    setupTypeField('customer_type');
    
    // Receiver
    setupTypeField('receiver_type');
});