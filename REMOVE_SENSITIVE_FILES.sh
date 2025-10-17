#!/bin/bash
# 🚨 CRITICAL: Remove Sensitive Files from Git History
# This script removes attached_assets folder from entire Git history

echo "⚠️  WARNING: This will rewrite Git history!"
echo "⚠️  All collaborators must re-clone the repository after this."
echo ""
read -p "Continue? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "Cancelled."
    exit 1
fi

echo ""
echo "🔒 STEP 1: Removing attached_assets from Git history..."
echo "This may take a few minutes..."

# Use git filter-repo (recommended) or filter-branch
if command -v git-filter-repo &> /dev/null; then
    echo "Using git-filter-repo (modern method)..."
    git filter-repo --path attached_assets --invert-paths --force
else
    echo "Using git filter-branch (fallback method)..."
    git filter-branch --force --index-filter \
        'git rm -rf --cached --ignore-unmatch attached_assets' \
        --prune-empty --tag-name-filter cat -- --all
fi

echo ""
echo "🔒 STEP 2: Cleaning up references..."
rm -rf .git/refs/original/
git reflog expire --expire=now --all
git gc --prune=now --aggressive

echo ""
echo "✅ Sensitive files removed from Git history!"
echo ""
echo "🚀 NEXT STEPS:"
echo "1. Force push to GitHub:"
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "2. Inform all collaborators to:"
echo "   - Delete their local repository"
echo "   - Re-clone from GitHub"
echo ""
echo "3. Consider rotating all exposed credentials:"
echo "   - Database passwords"
echo "   - API keys"
echo "   - Secret keys"
echo ""
echo "⚠️  WARNING: Anyone who saw the old commits may have the credentials!"
