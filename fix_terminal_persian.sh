#!/bin/bash

# Fix Persian/Farsi character display in terminal
echo "🔧 Fixing Persian character display in VS Code terminal..."

# Set proper locale
export LC_ALL=en_US.UTF-8
export LANG=en_US.UTF-8

# Test Persian text
echo "📝 Testing Persian text display:"
echo "سلام دنیا - تست متن فارسی"
echo "اعداد فارسی: ۱۲۳۴۵۶۷۸۹۰"
echo "متن ترکیبی: Hello سلام World جهان"

# Check if BiDi is working
echo "🔄 Testing RTL (Right-to-Left) text:"
echo "این متن باید از راست به چپ نمایش داده شود"

echo "✅ If you can see Persian text properly above, the issue is fixed!"
echo "📋 If not, please follow these additional steps:"
echo "   1. Restart VS Code completely"
echo "   2. In VS Code settings, try different fonts:"
echo "      - 'SF Mono', 'Monaco', 'Menlo'"
echo "      - 'JetBrains Mono', 'Fira Code'"
echo "   3. Set terminal.integrated.fontFamily in VS Code settings"
echo "   4. Consider using external terminal apps like iTerm2"