#!/bin/bash

# IDE Configuration Setup Script for Syntra
# This script sets up the system prompt for various IDEs

set -e

PROJECT_ROOT=$(pwd)
IDE_DIR="$PROJECT_ROOT/.ide"

echo "🚀 Setting up IDE configuration for Syntra..."

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -f "frontend/package.json" ]; then
    echo "❌ Error: Please run this script from the Syntra project root directory"
    exit 1
fi

echo "✅ Found Syntra project at: $PROJECT_ROOT"

# Create IDE configuration directory if it doesn't exist
mkdir -p "$IDE_DIR"

# Function to setup Cursor IDE
setup_cursor() {
    echo "📝 Setting up Cursor IDE configuration..."
    
    if [ -f "$IDE_DIR/cursor-rules.md" ]; then
        echo "✅ Cursor configuration already exists at $IDE_DIR/cursor-rules.md"
    else
        echo "❌ Cursor configuration not found. Please ensure .ide/cursor-rules.md exists"
        return 1
    fi
}

# Function to setup VSCode
setup_vscode() {
    echo "📝 Setting up VSCode configuration..."
    
    mkdir -p "$PROJECT_ROOT/.vscode"
    
    if [ -f "$PROJECT_ROOT/.vscode/settings.json" ]; then
        echo "✅ VSCode configuration already exists at .vscode/settings.json"
    else
        echo "❌ VSCode configuration not found. Please ensure .vscode/settings.json exists"
        return 1
    fi
}

# Function to setup Codeium (general setup for other IDEs)
setup_general() {
    echo "📝 General IDE configuration available..."
    
    if [ -f "$IDE_DIR/system-prompt.md" ]; then
        echo "✅ System prompt available at $IDE_DIR/system-prompt.md"
        echo "📋 You can copy this prompt to your IDE's system prompt configuration"
        echo "📄 Full path: $IDE_DIR/system-prompt.md"
    else
        echo "❌ System prompt not found. Please ensure .ide/system-prompt.md exists"
        return 1
    fi
}

# Main setup logic
echo ""
echo "🔧 Available IDE configurations:"
echo "1. Cursor IDE (cursor-rules.md)"
echo "2. VSCode (settings.json)" 
echo "3. General/Other IDEs (system-prompt.md)"
echo ""

# Check what IDEs are configured
cursor_available=false
vscode_available=false
general_available=false

if [ -f "$IDE_DIR/cursor-rules.md" ]; then
    cursor_available=true
fi

if [ -f "$PROJECT_ROOT/.vscode/settings.json" ]; then
    vscode_available=true
fi

if [ -f "$IDE_DIR/system-prompt.md" ]; then
    general_available=true
fi

# Setup each available configuration
if [ "$cursor_available" = true ]; then
    setup_cursor
else
    echo "⚠️  Cursor configuration not found"
fi

echo ""

if [ "$vscode_available" = true ]; then
    setup_vscode
else
    echo "⚠️  VSCode configuration not found"
fi

echo ""

if [ "$general_available" = true ]; then
    setup_general
else
    echo "⚠️  General system prompt not found"
fi

echo ""
echo "🎉 IDE configuration setup complete!"
echo ""
echo "📋 Next steps:"
echo "   • For Cursor: The rules file is already in place"
echo "   • For VSCode: Settings are configured in .vscode/settings.json"
echo "   • For other IDEs: Copy the prompt from .ide/system-prompt.md"
echo ""
echo "📖 The system prompt ensures:"
echo "   ✓ Consistent Markdown + LaTeX + code block formatting"
echo "   ✓ Proper mathematical notation using LaTeX"
echo "   ✓ Dark theme code blocks for easy copying"
echo "   ✓ Project-specific context awareness"
echo ""
echo "🔍 To verify your setup, ask your IDE assistant to explain a mathematical concept"
echo "   and check that it uses LaTeX notation (e.g., \$O(n \\log n)\$)"