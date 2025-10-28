#!/bin/bash

# Xcode Cloud Post-Clone Script
# This script runs after Xcode Cloud clones your repository

set -e

echo "🔧 Xcode Cloud Post-Clone Script Starting..."

# Xcode Cloud sets these environment variables
# CI_WORKSPACE: path to the cloned repository
# CI_PRIMARY_REPOSITORY_PATH: same as CI_WORKSPACE

# Determine repository root
if [ -n "$CI_WORKSPACE" ]; then
    REPO_ROOT="$CI_WORKSPACE"
else
    # Fallback for local testing
    REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

echo "📂 Repository root: $REPO_ROOT"
cd "$REPO_ROOT"

# Xcode Cloud typically has Node.js pre-installed, but we need to ensure it's in PATH
# Check for Node.js
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js found: $(node -v)"
else
    echo "❌ Node.js not found. Attempting to add Homebrew paths..."
    export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

    if command -v node >/dev/null 2>&1; then
        echo "✅ Node.js found after PATH update: $(node -v)"
    else
        echo "❌ Node.js still not found. Xcode Cloud should have Node pre-installed."
        exit 127
    fi
fi

# Check for npm
if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm not found"
    exit 127
fi

echo "📦 Installing npm dependencies..."
npm ci --prefer-offline --no-audit || npm install --no-audit

echo "🍎 Installing CocoaPods..."
cd "$REPO_ROOT/ios"

# CocoaPods should be pre-installed on Xcode Cloud
if ! command -v pod >/dev/null 2>&1; then
    echo "❌ CocoaPods not found. Trying to install with gem..."
    export PATH="/usr/local/bin:$PATH"
    # Xcode Cloud has Ruby, so we can try installing CocoaPods
    gem install cocoapods -v 1.15.2 --user-install
    export PATH="$HOME/.gem/ruby/2.6.0/bin:$PATH"
fi

if command -v pod >/dev/null 2>&1; then
    echo "✅ CocoaPods found: $(pod --version)"
    pod install
else
    echo "❌ CocoaPods installation failed"
    exit 127
fi

# Set NODE_BINARY for React Native build phase
echo "export NODE_BINARY=$(command -v node)" > .xcode.env.local

echo "✅ Post-clone setup complete!"
