# Phase 3 Plan - DAC Project

**Date**: January 11, 2025  
**Status**: 📋 **PLANNING** - Building on Phase 2 foundation

---

## 1. Current Technical State Summary

**Phase 2 Foundation (Complete & Verified)**:
- **Infrastructure**: Backend (FastAPI on port 8000) and frontend (Next.js on port 3000) are stable and tested
- **Performance**: TTFT p95 ~66ms (well under 300ms target), streaming SSE working correctly, soak tests show 100% availability
- **Testing**: Full test suite operational - SLO checks, TTFT probe, Playwright E2E (4/5 passing), Lighthouse CI, and soak tests all passing
- **API Layer**: Next.js proxy route `/api/chat` correctly forwards to backend streaming endpoint with thread management and provider routing

**Current DAC UI State**:
- **Main Interface**: `/conversations` page with 3-pane layout (conversation list, message area, settings panel)
- **Core Features**: Streaming chat with cancel functionality, TTFT/cache hit badges, skeleton loading indicators, message composer with keyboard shortcuts
- **Components**: Full component library (60+ Radix UI primitives, custom conversation/message components)
- **State Management**: React hooks for keyboard shortcuts, conversation/message state, provider/model selection
- **Known Gaps**: Conversation history persistence, thread management UI, provider configuration UI, usage metrics display, error recovery UX

---

## 2. Phase 3 Scope Proposal

**Goal**: Transform the stable Phase 2 foundation into a polished, production-ready chat experience with proper conversation management, settings, and user feedback.

### Phase 3 Goals (Prioritized)

1. **Conversation History & Thread Management** 🎯
   - **User Value**: Users can see past conversations, switch between threads, and resume context
   - **Technical Changes**:
     - Backend: Enhance `/api/threads/` list endpoint with pagination, search, and last message preview
     - Frontend: Improve `ConversationList` component to show real thread data with last message preview, timestamps, and unread indicators
     - Add thread creation/deletion UI with confirmation dialogs
     - Wire up thread selection to load messages from backend

2. **Provider & Model Configuration UI** ⚙️
   - **User Value**: Users can configure API keys, select preferred models, and see provider status
   - **Technical Changes**:
     - Backend: Enhance `/api/orgs/{org_id}/providers` endpoints for key management
     - Frontend: Build provider settings page (`/settings/providers`) with key input, model selection, and provider health indicators
     - Add validation and error handling for invalid API keys
     - Surface provider routing decisions in UI (why a provider was chosen)

3. **Enhanced Message Display & Actions** 💬
   - **User Value**: Better message formatting, copy/regenerate/edit actions, and clearer error states
   - **Technical Changes**:
     - Frontend: Enhance `MessageBubble` with markdown rendering, code syntax highlighting
     - Add message action toolbar (copy, regenerate, edit, delete) with proper hover states
     - Improve error message display with retry actions and clear error explanations
     - Add message timestamps and provider/model badges more prominently

4. **Usage Metrics & Analytics Dashboard** 📊
   - **User Value**: Users can see their usage stats, token consumption, and performance metrics
   - **Technical Changes**:
     - Backend: Enhance `/api/metrics/performance` to include user-facing stats (requests today, tokens used, avg TTFT)
     - Frontend: Create metrics dashboard component showing usage charts, provider performance, and cost estimates
     - Add daily/weekly/monthly views with simple visualizations

5. **Improved Error Handling & Recovery** 🛡️
   - **User Value**: Clear error messages, automatic retries, and graceful degradation
   - **Technical Changes**:
     - Frontend: Enhance `ErrorBanner` with retry logic, error categorization (network, provider, rate limit)
     - Add offline detection and queue messages for retry
     - Improve streaming error recovery (resume on network reconnect)

6. **Settings & Preferences** 🎨
   - **User Value**: Customize UI theme, default models, system prompts, and notification preferences
   - **Technical Changes**:
     - Frontend: Expand `SettingsPanel` with tabs for preferences, keyboard shortcuts help, and about section
     - Add localStorage persistence for user preferences
     - Add export/import conversation functionality

7. **Search & Filter Conversations** 🔍
   - **User Value**: Quickly find past conversations by content, date, or provider
   - **Technical Changes**:
     - Backend: Add search endpoint `/api/threads/search?q=...` with full-text search on message content
     - Frontend: Add search bar to `ConversationList` with real-time filtering
     - Add filter chips (by provider, date range, model)

---

## 3. Implementation Plan

### Frontend Tasks

#### Conversation History & Thread Management
- [ ] **Enhance ConversationList component** (`frontend/components/conversation-list.tsx`)
  - Add last message preview (truncated to 50 chars)
  - Add timestamp display (relative: "2 hours ago", absolute for old)
  - Add unread indicator (if thread has new messages)
  - Add thread title editing (inline or via dialog)
  - Add delete thread action with confirmation

- [ ] **Update ConversationsPage** (`frontend/app/conversations/page.tsx`)
  - Wire up thread selection to load messages from `/api/threads/{thread_id}`
  - Add "New Conversation" button that creates thread and switches to it
  - Add thread deletion handler
  - Persist active thread ID in URL query param or localStorage

- [ ] **Create ThreadActions component** (`frontend/components/thread-actions.tsx`)
  - Dropdown menu with: Rename, Delete, Archive, Export
  - Confirmation dialogs for destructive actions

- [ ] **Update API client** (`frontend/lib/api.ts`)
  - Add `getThread(threadId)` method
  - Add `deleteThread(threadId)` method
  - Add `updateThread(threadId, title)` method

#### Provider & Model Configuration UI
- [ ] **Build ProviderSettingsPage** (`frontend/app/settings/providers/page.tsx`)
  - List of providers (Perplexity, OpenAI, Gemini, OpenRouter)
  - For each provider: API key input (masked), test connection button, status indicator
  - Model selection dropdown per provider
  - Save/cancel actions

- [ ] **Create ProviderCard component** (`frontend/components/provider-card.tsx`)
  - Shows provider name, icon, status (connected/disconnected/error)
  - API key input with show/hide toggle
  - Test button that calls `/api/orgs/{org_id}/providers/{provider}/test`
  - Model selector dropdown

- [ ] **Create ProviderStatusBadge component** (`frontend/components/provider-status-badge.tsx`)
  - Visual indicator (green/yellow/red) for provider health
  - Tooltip with last error message if disconnected

#### Enhanced Message Display
- [ ] **Enhance MessageBubble** (`frontend/components/message-bubble.tsx`)
  - Add markdown rendering using `react-markdown` or similar
  - Add code syntax highlighting using `prism-react-renderer` or `shiki`
  - Improve timestamp display (show on hover, always visible for assistant messages)
  - Make provider/model badges more prominent

- [ ] **Enhance MessageActions** (`frontend/components/message-actions.tsx`)
  - Add hover toolbar with icons (copy, regenerate, edit, delete)
  - Add keyboard shortcuts (Cmd+C to copy, Cmd+R to regenerate)
  - Add confirmation for delete action

- [ ] **Create MarkdownRenderer component** (`frontend/components/markdown.tsx`)
  - Wrapper around markdown library with custom styling
  - Handles code blocks, links, lists, tables

#### Usage Metrics Dashboard
- [ ] **Create MetricsDashboard component** (`frontend/components/metrics-dashboard.tsx`)
  - Display cards: Requests Today, Tokens Used, Avg TTFT, Cost Estimate
  - Simple bar chart for requests over time (using `recharts` or similar)
  - Provider performance comparison (TTFT by provider)

- [ ] **Add MetricsPage** (`frontend/app/metrics/page.tsx`)
  - Full-page metrics dashboard
  - Date range selector (today, week, month)
  - Export data as CSV

- [ ] **Update API client** (`frontend/lib/api.ts`)
  - Add `getMetrics(dateRange)` method calling `/api/metrics/performance?last_n=...`

#### Error Handling Improvements
- [ ] **Enhance ErrorBanner** (`frontend/components/error-banner.tsx`)
  - Categorize errors (network, provider, rate limit, validation)
  - Add retry button with exponential backoff
  - Add "Report Issue" link for persistent errors

- [ ] **Add NetworkStatus component** (`frontend/components/network-status.tsx`)
  - Shows offline/online indicator
  - Queues messages when offline, sends when back online

#### Settings & Preferences
- [ ] **Expand SettingsPanel** (`frontend/components/settings-panel.tsx`)
  - Add tabs: General, Providers, Keyboard Shortcuts, About
  - Add preference toggles: Auto-scroll, Show timestamps, Compact mode
  - Add keyboard shortcuts help modal

- [ ] **Create PreferencesStore** (`frontend/lib/preferences.ts`)
  - localStorage wrapper for user preferences
  - Type-safe preference keys

#### Search & Filter
- [ ] **Add SearchBar to ConversationList** (`frontend/components/conversation-list.tsx`)
  - Real-time search input
  - Debounced API calls to `/api/threads/search?q=...`
  - Highlight matching text in results

- [ ] **Add FilterChips component** (`frontend/components/filter-chips.tsx`)
  - Filter by provider, date range, model
  - Clear all filters button

### Backend Tasks

#### Thread Management Enhancements
- [ ] **Enhance GET /api/threads/** (`backend/app/api/threads.py`)
  - Add pagination (limit, offset)
  - Add search parameter (full-text search on message content)
  - Include last message preview in response
  - Add sorting (by updated_at, created_at)

- [ ] **Add DELETE /api/threads/{thread_id}** (`backend/app/api/threads.py`)
  - Soft delete or hard delete (configurable)
  - Cascade delete messages

- [ ] **Add PATCH /api/threads/{thread_id}** (`backend/app/api/threads.py`)
  - Update thread title, description
  - Update last_provider, last_model

#### Provider Configuration
- [ ] **Enhance GET /api/orgs/{org_id}/providers** (`backend/app/api/providers.py`)
  - Return provider status (connected, error message, last tested)
  - Include available models per provider

- [ ] **Add POST /api/orgs/{org_id}/providers/{provider}/test** (`backend/app/api/providers.py`)
  - Test API key validity
  - Return status and error message if invalid

- [ ] **Add search endpoint** (`backend/app/api/threads.py`)
  - `GET /api/threads/search?q=...&org_id=...`
  - Full-text search on message content using PostgreSQL or Elasticsearch

#### Metrics Enhancements
- [ ] **Enhance GET /api/metrics/performance** (`backend/app/api/metrics.py`)
  - Add user-facing stats: requests_today, tokens_used_today, avg_ttft_today
  - Add cost estimates per provider
  - Add time-series data for charts

### Tests & Tooling

#### Playwright E2E Tests
- [ ] **Add conversation history tests** (`frontend/tests/conversation-history.spec.ts`)
  - Test: Create new conversation, send message, verify it appears in list
  - Test: Switch between conversations, verify messages load
  - Test: Delete conversation, verify it's removed from list
  - Test: Search conversations, verify filtering works

- [ ] **Add provider settings tests** (`frontend/tests/provider-settings.spec.ts`)
  - Test: Open provider settings, enter API key, save
  - Test: Test provider connection, verify status updates
  - Test: Select model, verify it's saved

- [ ] **Add message actions tests** (`frontend/tests/message-actions.spec.ts`)
  - Test: Copy message, verify clipboard content
  - Test: Regenerate message, verify new response
  - Test: Delete message, verify it's removed

- [ ] **Extend existing cancel.spec.ts**
  - Add test for message regeneration

#### Soak Tests (if new endpoints)
- [ ] **Update soak_test.py** (if needed)
  - Only if new high-traffic endpoints are added
  - Current endpoints already covered

#### Lighthouse CI
- [ ] **No changes needed** - existing config works
- [ ] **Add new pages to lighthouserc.json** if metrics dashboard is added:
  - `http://localhost:3000/metrics`
  - `http://localhost:3000/settings/providers`

---

## 4. First Implementation Slice: Conversation History & Thread Management

**Selected Goal**: #1 - Conversation History & Thread Management  
**Rationale**: High user value, builds on existing components, low risk, enables other features

### Code Scaffolding

#### Backend: Enhance Thread List Endpoint

**File**: `backend/app/api/threads.py`

```python
@router.get("/", response_model=List[ThreadListItemResponse])
async def list_threads(
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db),
    limit: int = 50,
    offset: int = 0,
    search: Optional[str] = None,
    sort_by: str = "updated_at",  # "updated_at" or "created_at"
    sort_order: str = "desc",  # "asc" or "desc"
):
    """List threads for an organization with pagination and search."""
    await set_rls_context(db, org_id)
    
    # Build query
    stmt = select(Thread).where(Thread.org_id == org_id)
    
    # Add search filter if provided
    if search:
        # Search in thread title, description, or message content
        # Join with messages for content search
        from app.models.message import Message
        stmt = stmt.join(Message, Thread.id == Message.thread_id).where(
            or_(
                Thread.title.ilike(f"%{search}%"),
                Thread.description.ilike(f"%{search}%"),
                Message.content.ilike(f"%{search}%"),
            )
        ).distinct()
    
    # Add sorting
    sort_column = Thread.updated_at if sort_by == "updated_at" else Thread.created_at
    if sort_order == "desc":
        stmt = stmt.order_by(sort_column.desc())
    else:
        stmt = stmt.order_by(sort_column.asc())
    
    # Add pagination
    stmt = stmt.limit(limit).offset(offset)
    
    result = await db.execute(stmt)
    threads = result.scalars().all()
    
    # Get last message for each thread
    thread_list = []
    for thread in threads:
        # Get last message
        last_msg_stmt = select(Message).where(
            Message.thread_id == thread.id
        ).order_by(Message.created_at.desc()).limit(1)
        last_msg_result = await db.execute(last_msg_stmt)
        last_msg = last_msg_result.scalar_one_or_none()
        
        thread_list.append(ThreadListItemResponse(
            id=thread.id,
            title=thread.title or "Untitled",
            description=thread.description,
            last_provider=thread.last_provider,
            last_model=thread.last_model,
            created_at=thread.created_at,
            updated_at=thread.updated_at or thread.created_at,
            last_message_preview=last_msg.content[:50] + "..." if last_msg and len(last_msg.content) > 50 else (last_msg.content if last_msg else None),
            last_message_at=last_msg.created_at if last_msg else thread.created_at,
            message_count=len(thread.messages) if hasattr(thread, 'messages') else 0,
        ))
    
    return thread_list


@router.delete("/{thread_id}")
async def delete_thread(
    thread_id: str,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db),
):
    """Delete a thread and all its messages."""
    await set_rls_context(db, org_id)
    
    thread = await _get_thread(db, thread_id, org_id)
    
    # Cascade delete messages (handled by SQLAlchemy relationship)
    await db.delete(thread)
    await db.commit()
    
    return {"status": "deleted", "thread_id": thread_id}


@router.patch("/{thread_id}", response_model=ThreadDetailResponse)
async def update_thread(
    thread_id: str,
    request: UpdateThreadRequest,
    org_id: str = Depends(require_org_id),
    db: AsyncSession = Depends(get_db),
):
    """Update thread metadata."""
    await set_rls_context(db, org_id)
    
    thread = await _get_thread(db, thread_id, org_id)
    
    if request.title is not None:
        thread.title = request.title
    if request.description is not None:
        thread.description = request.description
    
    await db.commit()
    await db.refresh(thread)
    
    # Return updated thread
    return await get_thread(thread_id, org_id, db)
```

**Add Pydantic models** (in same file or `backend/app/api/schemas.py`):

```python
class ThreadListItemResponse(BaseModel):
    id: str
    title: str
    description: Optional[str]
    last_provider: Optional[str]
    last_model: Optional[str]
    created_at: datetime
    updated_at: datetime
    last_message_preview: Optional[str]
    last_message_at: Optional[datetime]
    message_count: int

class UpdateThreadRequest(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
```

#### Frontend: Enhance ConversationList Component

**File**: `frontend/components/conversation-list.tsx`

```typescript
'use client'

import * as React from 'react'
import { ConversationCard } from './conversation-card'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { ScrollArea } from './ui/scroll-area'
import { Plus, Search, X } from 'lucide-react'
import { apiFetch } from '@/lib/api'

export interface Conversation {
  id: string
  title: string
  description?: string
  last_provider?: string
  last_model?: string
  created_at: string
  updated_at: string
  last_message_preview?: string
  last_message_at?: string
  message_count: number
}

interface ConversationListProps {
  conversations: Conversation[]
  activeConversationId: string | null
  onSelectConversation: (id: string) => void
  onNewConversation: () => void
  onDeleteConversation?: (id: string) => void
  isLoading?: boolean
}

export function ConversationList({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
}: ConversationListProps) {
  const [searchQuery, setSearchQuery] = React.useState('')
  const [filteredConversations, setFilteredConversations] = React.useState(conversations)

  // Filter conversations by search query
  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredConversations(conversations)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = conversations.filter(
      (conv) =>
        conv.title.toLowerCase().includes(query) ||
        conv.last_message_preview?.toLowerCase().includes(query) ||
        conv.description?.toLowerCase().includes(query)
    )
    setFilteredConversations(filtered)
  }, [searchQuery, conversations])

  const formatTimestamp = (dateString: string): string => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className="flex flex-col h-full border-r border-border bg-card">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Conversations</h2>
          <Button
            onClick={onNewConversation}
            size="sm"
            className="gap-2"
            data-testid="new-conversation-button"
          >
            <Plus className="w-4 h-4" />
            New
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 pr-8"
            data-testid="conversation-search-input"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
              data-testid="clear-search-button"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-1">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading conversations...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              {searchQuery ? 'No conversations match your search' : 'No conversations yet'}
            </div>
          ) : (
            filteredConversations.map((conversation) => (
              <ConversationCard
                key={conversation.id}
                conversation={conversation}
                isActive={conversation.id === activeConversationId}
                onClick={() => onSelectConversation(conversation.id)}
                onDelete={onDeleteConversation}
                timestamp={formatTimestamp(conversation.updated_at)}
                preview={conversation.last_message_preview}
                data-testid={`conversation-card-${conversation.id}`}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  )
}
```

**File**: `frontend/components/conversation-card.tsx` (enhance existing)

```typescript
'use client'

import * as React from 'react'
import { Button } from './ui/button'
import { MoreVertical, Trash2, Edit2 } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from './ui/dropdown-menu'
import type { Conversation } from './conversation-list'

interface ConversationCardProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
  onDelete?: (id: string) => void
  timestamp: string
  preview?: string
  'data-testid'?: string
}

export function ConversationCard({
  conversation,
  isActive,
  onClick,
  onDelete,
  timestamp,
  preview,
  'data-testid': testId,
}: ConversationCardProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = React.useState(false)

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (showDeleteConfirm && onDelete) {
      onDelete(conversation.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000) // Auto-cancel after 3s
    }
  }

  return (
    <div
      onClick={onClick}
      data-testid={testId}
      className={`
        group relative p-3 rounded-lg cursor-pointer transition-colors
        ${isActive ? 'bg-accent' : 'hover:bg-accent/50'}
      `}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate">{conversation.title}</h3>
          {preview && (
            <p className="text-xs text-muted-foreground truncate mt-1">{preview}</p>
          )}
          <div className="flex items-center gap-2 mt-2">
            <span className="text-xs text-muted-foreground">{timestamp}</span>
            {conversation.message_count > 0 && (
              <span className="text-xs text-muted-foreground">
                {conversation.message_count} message{conversation.message_count !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              data-testid={`conversation-menu-${conversation.id}`}
            >
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
              <Edit2 className="w-4 h-4 mr-2" />
              Rename
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleDelete}
              className="text-destructive"
              data-testid={`delete-conversation-${conversation.id}`}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              {showDeleteConfirm ? 'Confirm Delete' : 'Delete'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
```

**File**: `frontend/app/conversations/page.tsx` (update existing)

```typescript
// Add to existing imports
import { useRouter, useSearchParams } from 'next/navigation'

// Update loadConversations function
const loadConversations = async () => {
  setIsLoading(true)
  try {
    const response = await apiFetch('/threads/', ORG_ID, {
      params: { limit: 100, sort_by: 'updated_at', sort_order: 'desc' },
    })
    const threads: Conversation[] = await response.json()
    setConversations(threads)
    
    // If no active conversation, select the first one
    if (!activeConversationId && threads.length > 0) {
      setActiveConversationId(threads[0].id)
      loadMessages(threads[0].id)
    }
  } catch (err) {
    console.error('Failed to load conversations:', err)
    setError('Failed to load conversations')
  } finally {
    setIsLoading(false)
  }
}

// Add loadMessages function
const loadMessages = async (threadId: string) => {
  setIsLoading(true)
  try {
    const response = await apiFetch(`/threads/${threadId}`, ORG_ID)
    const threadData = await response.json()
    setMessages(threadData.messages || [])
    setActiveConversationId(threadId)
    
    // Update URL without navigation
    router.replace(`/conversations?thread=${threadId}`)
  } catch (err) {
    console.error('Failed to load messages:', err)
    setError('Failed to load messages')
  } finally {
    setIsLoading(false)
  }
}

// Add handleNewConversation
const handleNewConversation = async () => {
  try {
    const response = await apiFetch('/threads/', ORG_ID, {
      method: 'POST',
      body: JSON.stringify({ title: 'New Conversation' }),
    })
    const newThread = await response.json()
    await loadConversations() // Reload to get updated list
    setActiveConversationId(newThread.id)
    setMessages([])
    router.replace(`/conversations?thread=${newThread.id}`)
  } catch (err) {
    console.error('Failed to create conversation:', err)
    setError('Failed to create new conversation')
  }
}

// Add handleDeleteConversation
const handleDeleteConversation = async (threadId: string) => {
  try {
    await apiFetch(`/threads/${threadId}`, ORG_ID, { method: 'DELETE' })
    await loadConversations() // Reload list
    
    // If deleted thread was active, select first remaining or clear
    if (activeConversationId === threadId) {
      if (conversations.length > 1) {
        const remaining = conversations.find((c) => c.id !== threadId)
        if (remaining) {
          setActiveConversationId(remaining.id)
          loadMessages(remaining.id)
        }
      } else {
        setActiveConversationId(null)
        setMessages([])
      }
    }
  } catch (err) {
    console.error('Failed to delete conversation:', err)
    setError('Failed to delete conversation')
  }
}

// Update ConversationList usage in JSX
<ConversationList
  conversations={conversations}
  activeConversationId={activeConversationId}
  onSelectConversation={loadMessages}
  onNewConversation={handleNewConversation}
  onDeleteConversation={handleDeleteConversation}
  isLoading={isLoading}
/>
```

**File**: `frontend/lib/api.ts` (add methods)

```typescript
// Add to existing apiFetch wrapper
export async function getThread(threadId: string, orgId: string) {
  return apiFetch(`/threads/${threadId}`, orgId)
}

export async function deleteThread(threadId: string, orgId: string) {
  return apiFetch(`/threads/${threadId}`, orgId, { method: 'DELETE' })
}

export async function updateThread(threadId: string, orgId: string, updates: { title?: string; description?: string }) {
  return apiFetch(`/threads/${threadId}`, orgId, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}
```

#### Playwright Tests

**File**: `frontend/tests/conversation-history.spec.ts`

```typescript
/**
 * Playwright E2E tests for conversation history and thread management
 */

import { test, expect } from '@playwright/test'

const APP_URL = process.env.APP_URL ?? 'http://localhost:3000'
const CONVERSATIONS_PAGE = `${APP_URL}/conversations`

test.describe('Conversation History', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(CONVERSATIONS_PAGE)
    await page.waitForLoadState('networkidle')
  })

  test('create new conversation and send message', async ({ page }) => {
    // Click "New" button
    const newButton = page.locator('[data-testid="new-conversation-button"]')
    await expect(newButton).toBeVisible()
    await newButton.click()

    // Wait for new conversation to appear in list
    const conversationCards = page.locator('[data-testid^="conversation-card-"]')
    await expect(conversationCards.first()).toBeVisible({ timeout: 5000 })

    // Send a message
    const input = page.getByRole('textbox', { name: /message|prompt/i }).or(page.locator('textarea')).first()
    await input.fill('Test message for new conversation')
    const sendButton = page.getByRole('button', { name: /send/i })
    await sendButton.click()

    // Wait for response
    await page.waitForTimeout(3000)

    // Verify message appears
    const messages = page.locator('[role="article"]')
    await expect(messages.last()).toBeVisible()
  })

  test('switch between conversations', async ({ page }) => {
    // Create first conversation and send message
    await page.locator('[data-testid="new-conversation-button"]').click()
    await page.waitForTimeout(1000)
    
    const input1 = page.getByRole('textbox', { name: /message|prompt/i }).or(page.locator('textarea')).first()
    await input1.fill('Message 1')
    await page.getByRole('button', { name: /send/i }).click()
    await page.waitForTimeout(2000)

    // Create second conversation
    await page.locator('[data-testid="new-conversation-button"]').click()
    await page.waitForTimeout(1000)
    
    const input2 = page.getByRole('textbox', { name: /message|prompt/i }).or(page.locator('textarea')).first()
    await input2.fill('Message 2')
    await page.getByRole('button', { name: /send/i }).click()
    await page.waitForTimeout(2000)

    // Switch back to first conversation
    const conversationCards = page.locator('[data-testid^="conversation-card-"]')
    await conversationCards.first().click()
    await page.waitForTimeout(1000)

    // Verify first conversation's message is visible
    const messages = page.locator('[role="article"]')
    await expect(messages.first()).toContainText('Message 1')
  })

  test('search conversations', async ({ page }) => {
    // Create conversations with different content
    // ... (similar to above)

    // Use search input
    const searchInput = page.locator('[data-testid="conversation-search-input"]')
    await searchInput.fill('Message 1')
    await page.waitForTimeout(500)

    // Verify filtered results
    const conversationCards = page.locator('[data-testid^="conversation-card-"]')
    const count = await conversationCards.count()
    expect(count).toBeGreaterThan(0)
    await expect(conversationCards.first()).toContainText('Message 1')
  })

  test('delete conversation', async ({ page }) => {
    // Create conversation
    await page.locator('[data-testid="new-conversation-button"]').click()
    await page.waitForTimeout(1000)

    // Get conversation ID from first card
    const firstCard = page.locator('[data-testid^="conversation-card-"]').first()
    const cardTestId = await firstCard.getAttribute('data-testid')
    const conversationId = cardTestId?.replace('conversation-card-', '')

    // Open menu and delete
    const menuButton = page.locator(`[data-testid="conversation-menu-${conversationId}"]`)
    await menuButton.click()
    const deleteButton = page.locator(`[data-testid="delete-conversation-${conversationId}"]`)
    await deleteButton.click()
    // Click again to confirm (if confirmation is required)
    await deleteButton.click()

    // Verify conversation is removed
    await expect(firstCard).not.toBeVisible({ timeout: 5000 })
  })
})
```

---

## 5. Documentation: Phase 3 Validation Guide

### How to Run & Validate Phase 3 Additions

#### Prerequisites
- Backend running on `http://localhost:8000`
- Frontend running on `http://localhost:3000`
- All Phase 2 tests passing

#### Manual Testing Checklist

**Conversation History & Thread Management**:
1. Navigate to `http://localhost:3000/conversations`
2. Click "New" button → verify new conversation appears in list
3. Send a message → verify it appears in message area
4. Create second conversation → verify both appear in list
5. Click on first conversation → verify messages load correctly
6. Use search bar → verify conversations filter by title/preview
7. Click menu (three dots) on conversation → verify "Delete" option
8. Delete conversation → verify it's removed from list

**Commands to Run**:
```bash
# Backend health check
curl http://localhost:8000/health

# List threads (should return JSON array)
curl -H "x-org-id: org_demo" http://localhost:8000/api/threads/

# Get specific thread
curl -H "x-org-id: org_demo" http://localhost:8000/api/threads/{thread_id}

# Delete thread
curl -X DELETE -H "x-org-id: org_demo" http://localhost:8000/api/threads/{thread_id}
```

#### Automated Testing

**Playwright Tests**:
```bash
# Run conversation history tests
cd frontend
APP_URL="http://localhost:3000" npx playwright test tests/conversation-history.spec.ts --reporter=list

# Run all Phase 3 tests (when more are added)
APP_URL="http://localhost:3000" npx playwright test tests/ --reporter=list
```

**Existing Phase 2 Tests** (should still pass):
```bash
# SLO Check
./alert.sh

# TTFT Probe
node scripts/ttft_probe.mjs

# Existing Playwright tests
cd frontend && APP_URL="http://localhost:3000" npx playwright test tests/cancel.spec.ts

# Lighthouse CI
cd frontend && npm run lh:ci

# Soak Test
python3 soak_test.py --url "http://localhost:3000/api/chat" --concurrency 2 --duration 60
```

#### Expected Behavior

**Conversation List**:
- Shows all threads sorted by `updated_at` (most recent first)
- Each card shows: title, last message preview (truncated), timestamp, message count
- Search filters in real-time
- Active conversation is highlighted
- Clicking a conversation loads its messages

**Thread Management**:
- "New" button creates thread and switches to it
- Delete removes thread and all messages (with confirmation)
- URL updates to `/conversations?thread={id}` when thread is selected

**Error Handling**:
- Network errors show in ErrorBanner
- Failed API calls are retried automatically
- Invalid thread IDs show 404 message

---

## Next Steps

1. **Implement Conversation History** (this slice) - ~2-3 days
2. **Add Provider Settings UI** - ~2 days
3. **Enhance Message Display** - ~1-2 days
4. **Build Metrics Dashboard** - ~2-3 days
5. **Improve Error Handling** - ~1 day
6. **Add Settings & Preferences** - ~1-2 days
7. **Implement Search & Filter** - ~1 day

**Total Estimated Time**: ~10-14 days for full Phase 3

---

**Report Generated**: January 11, 2025  
**Status**: 📋 **READY FOR IMPLEMENTATION**

