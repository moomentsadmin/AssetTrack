#!/bin/bash
# Clean up all legacy deployment documentation files

echo "=========================================="
echo "Cleaning Up Legacy Documentation"
echo "=========================================="
echo ""

# Files to KEEP
KEEP_FILES=(
  "README.md"
  "replit.md"
  "design_guidelines.md"
  "DEPLOYMENT.md"
)

# Count files to delete
TOTAL_DELETED=0

echo "Files that will be KEPT:"
for file in "${KEEP_FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  ✓ $file"
  fi
done
echo ""

echo "Deleting legacy documentation files..."
echo ""

# Delete all .md files except the ones we want to keep
for file in *.md; do
  KEEP=false
  
  # Check if this file should be kept
  for keep_file in "${KEEP_FILES[@]}"; do
    if [ "$file" == "$keep_file" ]; then
      KEEP=true
      break
    fi
  done
  
  # Delete if not in keep list
  if [ "$KEEP" == false ]; then
    echo "  Deleting: $file"
    rm "$file"
    ((TOTAL_DELETED++))
  fi
done

echo ""
echo "=========================================="
echo "Cleanup Summary"
echo "=========================================="
echo "Files deleted: $TOTAL_DELETED"
echo "Files kept: ${#KEEP_FILES[@]}"
echo ""
echo "Remaining documentation files:"
ls -1 *.md 2>/dev/null || echo "  (none)"
echo ""
echo "✅ Legacy documentation cleaned up!"
echo "=========================================="
