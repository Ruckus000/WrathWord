#!/bin/sh

# Xcode Cloud Post-Clone Script
# This script runs after Xcode Cloud clones your repository

set -e

echo "📦 Installing Node.js dependencies..."
cd ..
npm install

echo "🍎 Installing CocoaPods dependencies..."
cd ios
pod install

echo "✅ Post-clone setup complete!"
