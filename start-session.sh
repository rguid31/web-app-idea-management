#!/bin/bash
echo "Starting new coding session..."
git pull origin main
echo "What feature are you working on? (e.g., login-page, navbar, etc.)"
read feature_name
git checkout -b "$feature_name"
echo "Created branch: $feature_name"
echo "Ready to code! 🚀"
