# IDE Configuration for Syntra

This directory contains IDE configuration files to ensure consistent AI assistant behavior across different development environments.

## Quick Setup

Run the setup script to configure your IDE:

```bash
cd /path/to/syntra
./.ide/setup.sh
```

## Files Overview

- **`system-prompt.md`** - Complete system prompt for AI coding assistants
- **`cursor-rules.md`** - Cursor IDE specific configuration
- **`setup.sh`** - Automated setup script
- **`README.md`** - This documentation

## Supported IDEs

### 1. Cursor IDE
- **File**: `cursor-rules.md`
- **Setup**: Automatic (file is detected by Cursor)
- **Features**: Project-specific rules with system prompt integration

### 2. VSCode
- **File**: `../.vscode/settings.json`
- **Setup**: Automatic when using compatible AI extensions
- **Features**: System prompt in settings, code formatting rules

### 3. Other IDEs (Codeium, GitHub Copilot, etc.)
- **File**: `system-prompt.md`
- **Setup**: Manual copy/paste into IDE settings
- **Features**: Complete system prompt text

## System Prompt Features

The system prompt ensures your AI assistant:

### ✅ Formatting Standards
- **Markdown structure** with proper headings and lists
- **Fenced code blocks** with language tags for all code
- **LaTeX notation** for mathematical expressions (`$...$` and `$$...$$`)

### ✅ Code Generation
- Respects existing project patterns and frameworks
- Provides complete, runnable examples
- Follows TypeScript/Python conventions used in Syntra

### ✅ Mathematical Notation
- Inline math: `$O(n \log n)$` → $O(n \log n)$
- Block math: `$$\int_0^1 x^2 dx$$` → $$\int_0^1 x^2 dx$$
- Algorithm complexity notation
- Statistical formulas

### ✅ Project Context
- Understands Syntra's tech stack (Next.js, FastAPI, etc.)
- Knows about the multi-LLM architecture
- References existing components and patterns

## Usage Examples

### Code Generation Request
```
"Create a React component for displaying model performance metrics"
```

**Expected Response:**
- Brief description
- Complete TypeScript/React code in fenced blocks
- Usage notes if needed

### Mathematical Explanation Request  
```
"Explain the time complexity of our routing algorithm"
```

**Expected Response:**
- LaTeX notation for complexity: $O(n \log n)$
- Step-by-step mathematical breakdown
- Code examples showing the algorithm

### Debugging Help
```
"Fix this TypeScript error in the chat interface"
```

**Expected Response:**
- Error explanation in plain text
- Corrected code in fenced TypeScript block
- Brief explanation of the fix

## Verification

To test your setup:

1. Ask your AI assistant: *"Explain the time complexity of binary search using mathematical notation"*

2. Verify the response includes:
   - LaTeX math: $O(\log n)$
   - Fenced code blocks with language tags
   - Proper Markdown formatting

3. The response should render beautifully in your IDE with:
   - Formatted math expressions
   - Syntax-highlighted code blocks
   - Clean Markdown structure

## Troubleshooting

### Issue: Math not rendering
- **Cause**: IDE doesn't support LaTeX rendering
- **Solution**: Check if your IDE has LaTeX preview extensions

### Issue: Code blocks not highlighted
- **Cause**: Missing language tags in fenced blocks
- **Solution**: Verify the system prompt is properly loaded

### Issue: Inconsistent responses
- **Cause**: System prompt not loaded or conflicting settings
- **Solution**: Re-run `setup.sh` and check IDE-specific settings

## Customization

You can customize the system prompt by editing `system-prompt.md`. Key areas to modify:

- **Code style preferences** (line 45-55)
- **Project-specific context** (add your own patterns)
- **Mathematical notation rules** (line 80-100)
- **Response formatting** (line 120-140)

After making changes, restart your IDE or reload the AI assistant configuration.