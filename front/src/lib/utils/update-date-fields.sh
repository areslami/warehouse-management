#!/bin/bash

# Script to update all date input fields to use PersianDatePicker

MODAL_DIR="/Users/alihamedi/Desktop/shams-erp/front/src/components/modals"

# Files to update
FILES=(
  "salesproforma-modal.tsx"
  "purchaseproforma-modal.tsx"
  "warehouse-receipt-modal.tsx"
  "dispatch-issue-modal.tsx"
)

for FILE in "${FILES[@]}"; do
  FILEPATH="$MODAL_DIR/$FILE"
  
  if [ -f "$FILEPATH" ]; then
    echo "Updating $FILE..."
    
    # Add imports if not already present
    if ! grep -q "PersianDatePicker" "$FILEPATH"; then
      # Add import after the last import line
      sed -i '' '/^import.*from/{ 
        $ a\
import { PersianDatePicker } from "../ui/persian-date-picker";\
import { getTodayGregorian } from "@/lib/utils/persian-date";
      }' "$FILEPATH"
    fi
    
    # Replace date inputs with PersianDatePicker
    sed -i '' 's/<Input type="date" {...field} \/>/<PersianDatePicker value={field.value} onChange={field.onChange} placeholder={t("select-date")} \/>/g' "$FILEPATH"
    
    # Update getTodayDate function if present
    sed -i '' '/return new Date().toISOString().split/s/return new Date().toISOString().split.*$/return getTodayGregorian();/' "$FILEPATH"
    
    echo "✓ Updated $FILE"
  else
    echo "⨯ File not found: $FILE"
  fi
done

echo "Date field updates complete!"