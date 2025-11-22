# Multa Frontend Components Documentation

## Overview

This document provides a comprehensive guide to all new UI components built for the Multa (Data Analysis Copilot) conversation interface. All components follow the existing design system with dark theme and violet/purple accents.

---

## 🎨 Design System

### Colors
- **Background**: `oklch(0.05 0 0)` - Very dark
- **Foreground**: `oklch(0.98 0 0)` - Near white
- **Accent**: `oklch(0.55 0.18 270)` - Violet/Purple
- **Border**: `oklch(0.2 0 0)` - Subtle gray
- **Border Radius**: `0.625rem` (10px)

### Fonts
- **Sans**: Geist
- **Mono**: Geist Mono

### Provider Colors
```typescript
{
  perplexity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  openai: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}
```

---

## 📦 Components

### 1. ConversationLayout

**File**: `components/conversation-layout.tsx`

**Purpose**: Main 3-pane resizable layout for the conversation interface.

**Props**:
```typescript
interface ConversationLayoutProps {
  leftSidebar: React.ReactNode       // Conversation list
  children: React.ReactNode           // Main conversation view
  rightPanel?: React.ReactNode        // Settings panel
  defaultLeftSize?: number            // Default width % (default: 20)
  defaultRightSize?: number           // Default width % (default: 25)
  showRightPanel?: boolean            // Show/hide right panel
}
```

**Features**:
- ✅ Resizable panels with handles
- ✅ Collapsible sidebars
- ✅ Persistent panel sizes (localStorage)
- ✅ Responsive behavior
- ✅ Keyboard accessible

**Usage**:
```tsx
<ConversationLayout
  leftSidebar={<ConversationList {...} />}
  rightPanel={<SettingsPanel {...} />}
  showRightPanel={true}
>
  <div>Main conversation area</div>
</ConversationLayout>
```

---

### 2. ConversationList

**File**: `components/conversation-list.tsx`

**Purpose**: Left sidebar for browsing and managing conversations.

**Props**:
```typescript
interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId?: string
  onConversationSelect: (id: string) => void
  onNewConversation: () => void
  isLoading?: boolean
  className?: string
}

interface Conversation {
  id: string
  title: string
  lastMessage?: string
  providers?: string[]
  lastUpdated: Date
  unread?: boolean
}
```

**Features**:
- ✅ Search/filter conversations
- ✅ Create new conversation button
- ✅ Scrollable list with active state
- ✅ Loading skeletons
- ✅ Empty state
- ✅ Keyboard navigation (Cmd/Ctrl+F to focus search)
- ✅ Conversation count footer

**Usage**:
```tsx
<ConversationList
  conversations={conversations}
  activeConversationId={activeId}
  onConversationSelect={(id) => setActiveId(id)}
  onNewConversation={() => createNew()}
  isLoading={false}
/>
```

---

### 3. ConversationCard

**File**: `components/conversation-card.tsx`

**Purpose**: Individual conversation list item.

**Props**:
```typescript
interface ConversationCardProps {
  conversation: Conversation
  isActive?: boolean
  onClick: () => void
  className?: string
}
```

**Features**:
- ✅ Title with overflow ellipsis and tooltip
- ✅ Provider badges (color-coded)
- ✅ Last updated timestamp (relative time)
- ✅ Active state highlighting
- ✅ Unread indicator dot
- ✅ Hover effects

**Visual States**:
- **Active**: Left border in accent color, highlighted background
- **Unread**: Red dot indicator (top-right)
- **Hover**: Background accent, text color change

---

### 4. MessageBubble

**File**: `components/message-bubble.tsx`

**Purpose**: Enhanced message display with actions.

**Props**:
```typescript
interface MessageBubbleProps {
  message: Message
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  showTimestamp?: boolean
  className?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  provider?: string
  model?: string
  reason?: string
  isLoading?: boolean
  error?: string
}
```

**Features**:
- ✅ Avatar with provider/user identification
- ✅ Timestamp display (formatted)
- ✅ Provider badge with model info
- ✅ Hover actions (copy, regenerate, edit, delete)
- ✅ Error states
- ✅ Loading states
- ✅ Responsive max-width
- ✅ Accessible markup

**Layout**:
- **User messages**: Right-aligned, accent background, user avatar on right
- **Assistant messages**: Left-aligned, card background, provider avatar on left

---

### 5. MessageActions

**File**: `components/message-actions.tsx`

**Purpose**: Action toolbar for messages (shown on hover).

**Props**:
```typescript
interface MessageActionsProps {
  messageId: string
  content: string
  role: 'user' | 'assistant' | 'system'
  onCopy?: (content: string) => void
  onRegenerate?: (messageId: string) => void
  onEdit?: (messageId: string) => void
  onDelete?: (messageId: string) => void
  className?: string
}
```

**Features**:
- ✅ Copy button (shows checkmark on success)
- ✅ Regenerate (assistant messages only)
- ✅ Edit (user messages only)
- ✅ Delete (dropdown menu)
- ✅ Keyboard shortcut hints
- ✅ Backdrop blur effect

---

### 6. MessageComposer

**File**: `components/message-composer.tsx`

**Purpose**: Enhanced multiline input for composing messages.

**Props**:
```typescript
interface MessageComposerProps {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  onCancel?: () => void
  isLoading?: boolean
  disabled?: boolean
  selectedModels?: string[]
  onModelToggle?: (model: string) => void
  placeholder?: string
  maxLength?: number
  showCharacterCount?: boolean
  autoFocus?: boolean
  className?: string
}
```

**Features**:
- ✅ Auto-resizing textarea (60px - 300px)
- ✅ Character count with warning colors
- ✅ Model selection badges (removable)
- ✅ Keyboard shortcuts:
  - `Cmd/Ctrl+Enter` to send
  - `Esc` to cancel
- ✅ Loading state with spinner
- ✅ Disabled state
- ✅ Submit validation
- ✅ Focus states with accent ring
- ✅ Keyboard hint display

---

### 7. TypingIndicator

**File**: `components/typing-indicator.tsx`

**Purpose**: Animated typing indicator for AI responses.

**Props**:
```typescript
interface TypingIndicatorProps {
  provider?: string
  model?: string
  className?: string
}
```

**Features**:
- ✅ Three-dot bouncing animation
- ✅ Provider avatar
- ✅ Optional provider/model label
- ✅ Accessible loading state (aria-live)

**Animation**:
- Three dots with staggered bounce animation
- Colors match accent theme

---

### 8. SettingsPanel

**File**: `components/settings-panel.tsx`

**Purpose**: Right sidebar for conversation settings and context.

**Props**:
```typescript
interface SettingsPanelProps {
  selectedModels?: string[]
  availableModels?: Model[]
  onModelChange?: (models: string[]) => void
  systemPrompt?: string
  onSystemPromptChange?: (prompt: string) => void
  temperature?: number
  onTemperatureChange?: (value: number) => void
  maxTokens?: number
  onMaxTokensChange?: (value: number) => void
  contextDocuments?: ContextDocument[]
  onAddContext?: () => void
  onRemoveContext?: (id: string) => void
  onClose?: () => void
  className?: string
}
```

**Features**:
- ✅ Tabbed interface (Settings, Context)
- ✅ Model selection with ModelSelector component
- ✅ System prompt editor with save/reset
- ✅ Temperature slider (0-2, step 0.1)
- ✅ Max tokens slider (100-4000, step 100)
- ✅ Context document management
- ✅ Token usage display
- ✅ Collapsible sections
- ✅ Close button

**Tabs**:
1. **Settings**: Model selection, system prompt, parameters
2. **Context**: Attached documents, token usage

---

### 9. ModelSelector

**File**: `components/model-selector.tsx`

**Purpose**: Multi-select dropdown for choosing LLM models.

**Props**:
```typescript
interface ModelSelectorProps {
  selectedModels: string[]
  availableModels: Model[]
  onSelectionChange?: (models: string[]) => void
  maxSelection?: number
  className?: string
}

interface Model {
  id: string
  name: string
  provider: string
  description?: string
}
```

**Features**:
- ✅ Multiple model selection
- ✅ Grouped by provider
- ✅ Badge display of selected models
- ✅ Maximum selection limit
- ✅ Provider color coding
- ✅ Checkboxes with instant feedback
- ✅ "Clear all" button
- ✅ Selection count display

---

### 10. EmptyConversation

**File**: `components/empty-conversation.tsx`

**Purpose**: Friendly empty state with example prompts.

**Props**:
```typescript
interface EmptyConversationProps {
  onPromptSelect?: (prompt: string) => void
  showExamples?: boolean
  className?: string
}
```

**Features**:
- ✅ Welcoming message with icon
- ✅ Example prompt cards (4 categories):
  - Creative (Brainstorm)
  - Technical (Code)
  - Analysis (Data)
  - Learning (Advice)
- ✅ One-click prompt insertion
- ✅ Category badges
- ✅ Responsive grid layout (1 or 2 columns)
- ✅ Keyboard navigation
- ✅ Platform capabilities display

---

### 11. ErrorBanner

**File**: `components/error-banner.tsx`

**Purpose**: Dismissible error notification banner.

**Props**:
```typescript
interface ErrorBannerProps {
  type?: ErrorType // 'network' | 'api' | 'auth' | 'ratelimit' | 'generic'
  title?: string
  message: string
  onRetry?: () => void
  onDismiss?: () => void
  persistent?: boolean
  className?: string
}
```

**Features**:
- ✅ Different error types with appropriate icons
- ✅ Retry action button
- ✅ Dismissible (X button)
- ✅ Persistent or auto-hide (8 seconds)
- ✅ Accessible (aria-live="assertive")
- ✅ Slide-in animation

**Error Types**:
- **network**: WiFi icon, "Connection Error"
- **api**: Alert icon, "API Error"
- **auth**: Alert icon, "Authentication Error"
- **ratelimit**: Alert icon, "Rate Limit Exceeded" (default variant)
- **generic**: Alert icon, "Error"

---

### 12. ThemeSwitcher

**File**: `components/theme-switcher.tsx`

**Purpose**: Theme toggle between light, dark, and system.

**Props**:
```typescript
interface ThemeSwitcherProps {
  className?: string
}
```

**Features**:
- ✅ Light/Dark/System modes
- ✅ Dropdown menu selection
- ✅ Icon indicators (Sun/Moon/Monitor)
- ✅ Persists preference (localStorage)
- ✅ Accessible
- ✅ Hydration-safe

---

## 🎯 Hooks

### useKeyboardShortcuts

**File**: `hooks/use-keyboard-shortcuts.ts`

**Purpose**: Manage keyboard shortcuts application-wide.

**Usage**:
```typescript
useKeyboardShortcuts([
  {
    key: 'n',
    metaKey: true,
    callback: () => createNewConversation(),
    description: 'New conversation',
  },
  {
    key: 'Enter',
    metaKey: true,
    callback: () => sendMessage(),
    description: 'Send message',
  },
])
```

**Pre-defined Shortcuts**:
- `Cmd/Ctrl+N`: New conversation
- `Cmd/Ctrl+F`: Search conversations
- `Cmd/Ctrl+Enter`: Send message
- `Escape`: Cancel or close
- `Cmd/Ctrl+Shift+C`: Copy last message
- `Cmd/Ctrl+R`: Regenerate response
- `Cmd/Ctrl+E`: Edit last message
- `Cmd/Ctrl+K`: Open command palette
- `Cmd/Ctrl+,`: Open settings
- `Cmd/Ctrl+/`: Show keyboard shortcuts

**Helper Functions**:
- `useModifierKey()`: Returns 'Cmd' or 'Ctrl' based on platform
- `formatShortcut(shortcut)`: Formats shortcut for display (e.g., "⌘+N" or "Ctrl+N")

---

## 📱 Pages

### ConversationsPage

**File**: `app/conversations/page.tsx`

**Purpose**: Main conversation interface with 3-pane layout.

**Features**:
- ✅ Full 3-pane layout implementation
- ✅ Conversation list with search
- ✅ Message history display
- ✅ Real-time message sending
- ✅ Settings panel integration
- ✅ Error handling
- ✅ Keyboard shortcuts
- ✅ Optimistic UI updates
- ✅ Toast notifications
- ✅ Theme switcher
- ✅ Auto-scroll to bottom
- ✅ Provider routing
- ✅ Loading states

**State Management**:
- Conversations list
- Active conversation
- Messages array
- Loading states
- Error states
- Settings (models, system prompt, temperature, max tokens)

**API Integration**:
- `GET /api/threads/` - Load conversations
- `POST /api/threads/` - Create new thread
- `POST /api/router/choose` - Route to provider
- `POST /api/threads/{id}/messages` - Send message

---

## 🎨 Styling Guidelines

### Component Structure
```tsx
// Always use cn() for conditional classes
<div className={cn(
  'base-classes',
  conditionalClass && 'conditional-classes',
  className // Allow external className override
)}>
```

### Spacing
- **Component padding**: `p-4` or `p-6`
- **Card padding**: `p-4` for content
- **Gap between items**: `gap-2` to `gap-4`
- **Section spacing**: `space-y-4` to `space-y-6`

### Typography
- **Headings**: `text-lg font-semibold` to `text-2xl font-bold`
- **Body**: `text-sm` or default
- **Muted text**: `text-muted-foreground`
- **Small text**: `text-xs`
- **Tiny text**: `text-[10px]`

### Interactive Elements
- **Buttons**: Use `Button` component with variants
- **Hover states**: `hover:bg-accent` or `hover:bg-accent/50`
- **Focus states**: `focus-visible:ring-2 focus-visible:ring-accent`
- **Transitions**: `transition-colors` or `transition-all`

### Accessibility
- Always include `aria-label` for icon-only buttons
- Use semantic HTML (`<nav>`, `<main>`, `<article>`)
- Include `role` attributes where appropriate
- Add `aria-live` for dynamic content
- Ensure keyboard navigation works
- Provide focus indicators

---

## 🚀 Getting Started

### 1. Import Components
```tsx
import { ConversationLayout } from '@/components/conversation-layout'
import { ConversationList } from '@/components/conversation-list'
import { MessageBubble } from '@/components/message-bubble'
import { MessageComposer } from '@/components/message-composer'
import { SettingsPanel } from '@/components/settings-panel'
// ... etc
```

### 2. Use in Pages
See `/app/conversations/page.tsx` for complete implementation example.

### 3. Customize
All components accept `className` prop for additional customization.

---

## ✨ Features Summary

### Implemented ✅
- [x] 3-pane resizable layout
- [x] Conversation list with search
- [x] Message bubbles with timestamps
- [x] Message actions (copy, regenerate, edit, delete)
- [x] Multiline message composer
- [x] Typing indicator animation
- [x] Settings panel with tabs
- [x] Model selection
- [x] System prompt editor
- [x] Temperature and token controls
- [x] Empty states
- [x] Error handling
- [x] Loading states
- [x] Theme switcher
- [x] Keyboard shortcuts
- [x] Toast notifications
- [x] Provider color coding
- [x] Responsive design
- [x] Accessibility features
- [x] Auto-scroll
- [x] Character count
- [x] Optimistic UI

### Next Steps 🔜
- [ ] Markdown rendering in messages
- [ ] Code syntax highlighting
- [ ] Message threading/branching
- [ ] File attachments
- [ ] Image support
- [ ] Streaming responses
- [ ] Export conversations
- [ ] Search within conversation
- [ ] Message reactions
- [ ] Conversation tags

---

## 📝 Notes

- All components match the existing dark theme with violet accents
- Components are fully typed with TypeScript
- Accessibility is baked into every component
- Responsive design works on desktop, tablet, and mobile
- Keyboard shortcuts follow platform conventions (Cmd on Mac, Ctrl on Windows/Linux)
- All state is managed with React hooks
- API integration uses the existing `apiFetch` utility

---

## 🐛 Troubleshooting

### Hydration Errors
Add `suppressHydrationWarning` to `<html>` tag for theme support.

### Theme Not Working
Ensure `ThemeProvider` is in `layout.tsx` and wraps all content.

### Keyboard Shortcuts Not Working
Check that no input is focused. Most shortcuts are global except in text inputs.

### Components Not Rendering
Verify all imports use `'use client'` directive at the top of the file.

---

**Last Updated**: November 9, 2025
**Version**: 1.0
**Total Components**: 12 core + 1 hook
**Lines of Code**: ~2500
