#!/bin/bash
echo "🏁 Finishing coding session..."

# Get current branch name
current_branch=$(git branch --show-current)

# Check if we're on main branch
if [ "$current_branch" = "main" ]; then
    echo "❌ You're already on main branch. Nothing to finish."
    echo "💡 Use this script when you're on a feature branch."
    exit 1
fi

echo "📋 Current branch: $current_branch"

# Show what files have changed
echo ""
echo "📁 Files changed in this branch:"
git diff --name-only main..HEAD

# Ask if user wants to continue
echo ""
read -p "🤔 Do you want to merge '$current_branch' into main? (y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "❌ Cancelled. Staying on branch: $current_branch"
    exit 1
fi

# Check if there are uncommitted changes
if ! git diff-index --quiet HEAD --; then
    echo "⚠️  You have uncommitted changes. Committing them first..."
    read -p "📝 Enter commit message: " commit_message
    git add .
    git commit -m "$commit_message"
fi

# Switch to main and merge
echo "🔄 Switching to main branch..."
git checkout main

echo "⬇️  Pulling latest changes..."
git pull origin main

echo "🔀 Merging $current_branch into main..."
git merge "$current_branch"

echo "⬆️  Pushing updated main branch..."
git push origin main

echo "🗑️  Cleaning up: deleting branch $current_branch..."
git branch -d "$current_branch"

echo ""
echo "✅ Session finished successfully!"
echo "📊 Summary:"
echo "   - Merged: $current_branch → main"
echo "   - Pushed to GitHub"
echo "   - Cleaned up local branch"
echo "🚀 Ready for next session!"