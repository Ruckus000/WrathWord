#!/bin/bash

# Xcode Cloud Post-Clone Script
# This script runs after Xcode Cloud clones your repository

set -e

echo "🔧 Xcode Cloud Post-Clone Script Starting..."

# Determine repository root
if [ -n "$CI_WORKSPACE" ]; then
    REPO_ROOT="$CI_WORKSPACE"
else
    REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
fi

echo "📂 Repository root: $REPO_ROOT"
cd "$REPO_ROOT"

# Install Node.js using Homebrew (Xcode Cloud has Homebrew)
echo "📥 Installing Node.js via Homebrew..."

# Ensure Homebrew is in PATH
if command -v brew >/dev/null 2>&1; then
    echo "✅ Homebrew found"

    # Update Homebrew
    brew update

    # Install Node.js (this will use the latest LTS)
    brew install node@20 || brew install node

    # Add Node to PATH
    if [ -d "/opt/homebrew/opt/node@20/bin" ]; then
        export PATH="/opt/homebrew/opt/node@20/bin:$PATH"
    elif [ -d "/usr/local/opt/node@20/bin" ]; then
        export PATH="/usr/local/opt/node@20/bin:$PATH"
    fi

    # Also add general Homebrew paths
    export PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
else
    echo "❌ Homebrew not found - cannot install Node.js"
    exit 127
fi

# Verify Node.js installation
if command -v node >/dev/null 2>&1; then
    echo "✅ Node.js installed: $(node -v)"
    echo "✅ npm version: $(npm -v)"
else
    echo "❌ Node.js installation failed"
    exit 127
fi

# Install JavaScript dependencies
echo "📦 Installing npm dependencies..."
npm ci --prefer-offline --no-audit || npm install --no-audit

# Install CocoaPods dependencies
echo "🍎 Installing CocoaPods..."
cd "$REPO_ROOT/ios"

if command -v pod >/dev/null 2>&1; then
    echo "✅ CocoaPods found: $(pod --version)"
else
    echo "⚠️  CocoaPods not found, attempting to install..."
    export GEM_HOME="$HOME/.gem"
    export PATH="$GEM_HOME/bin:$PATH"
    gem install cocoapods --user-install
fi

# Verify CocoaPods
if command -v pod >/dev/null 2>&1; then
    echo "✅ Running pod install..."
    pod install
else
    echo "❌ CocoaPods installation failed"
    exit 127
fi

# Set NODE_BINARY for React Native build phase
NODE_PATH=$(command -v node)
echo "export NODE_BINARY=$NODE_PATH" > .xcode.env.local
echo "✅ Created .xcode.env.local with NODE_BINARY=$NODE_PATH"

echo "✅ Post-clone setup complete!"
