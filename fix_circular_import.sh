#!/bin/bash
# Fix circular import in InvenTree build/models.py

FILE="InvenTree-master/src/backend/InvenTree/build/models.py"

# Replace direct import with string reference
sed -i 's/part\.models\.BomItem/'"'"'part.BomItem'"'"'/g' "$FILE"

echo "✅ Fixed circular import in $FILE"
