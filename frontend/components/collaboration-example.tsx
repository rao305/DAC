"use client"

import { useState, useCallback } from 'react'
import { EnhancedChatInterface } from './enhanced-chat-interface'
import { useCollaborationStream } from '@/hooks/use-collaboration-stream'

interface CollaborationStage {
  id: string
  label: string
  status: "pending" | "active" | "done"
}

interface CollaborationState {
  mode: "thinking" | "streaming_final" | "complete"
  stages: CollaborationStage[]
  currentStageId?: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: any[]
  chainOfThought?: string
  timestamp?: string
  modelId?: string
  modelName?: string
  reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
  confidence?: number
  processingTime?: number
  collaboration?: CollaborationState
}

interface CollaborationExampleProps {
  threadId: string
  orgId?: string
}

/**
 * Example component showing how to integrate collaboration streaming
 * with the enhanced chat interface
 */
export function CollaborationExample({ threadId, orgId }: CollaborationExampleProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState('collaborate')

  // Update a specific message by ID
  const updateMessage = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id !== messageId) return msg
      
      const updatedMessage = { ...msg }
      
      // Handle functional updates for complex fields
      Object.entries(updates).forEach(([key, value]) => {
        if (typeof value === 'function') {
          updatedMessage[key as keyof Message] = value(msg)
        } else {
          updatedMessage[key as keyof Message] = value
        }
      })
      
      return updatedMessage
    }))
  }, [])

  // Add a new message to the chat
  const addMessage = useCallback((message: Message) => {
    setMessages(prev => [...prev, message])
  }, [])

  // Initialize collaboration streaming hook
  const { startCollaboration } = useCollaborationStream({
    threadId,
    orgId,
    onUpdateMessage: updateMessage,
    onAddMessage: addMessage
  })

  // Handle sending messages (both regular and collaboration)
  const handleSendMessage = useCallback(async (content: string, images?: any[]) => {
    // Add user message
    const userMessage: Message = {
      id: `user_${Date.now()}`,
      role: 'user',
      content,
      images,
      timestamp: new Date().toISOString()
    }
    
    addMessage(userMessage)

    // Check if this should trigger collaboration
    const shouldCollaborate = selectedModel === 'collaborate' || content.toLowerCase().includes('collaborate')
    
    if (shouldCollaborate) {
      setIsLoading(true)
      try {
        await startCollaboration(content, 'auto') // or 'manual' based on user preference
      } catch (error) {
        console.error('Collaboration failed:', error)
        // Add error message
        addMessage({
          id: `error_${Date.now()}`,
          role: 'assistant',
          content: `Sorry, collaboration failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          modelName: 'Error'
        })
      } finally {
        setIsLoading(false)
      }
    } else {
      // Handle regular (non-collaboration) messages here
      setIsLoading(true)
      
      setTimeout(() => {
        // Simulate regular assistant response
        addMessage({
          id: `assistant_${Date.now()}`,
          role: 'assistant',
          content: `This is a regular response to: "${content}"`,
          timestamp: new Date().toISOString(),
          modelName: selectedModel,
          reasoningType: 'conversation'
        })
        setIsLoading(false)
      }, 1000)
    }
  }, [selectedModel, addMessage, startCollaboration])

  const availableModels = [
    { id: 'collaborate', name: 'Syntra Collaborate' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gemini', name: 'Gemini' },
    { id: 'claude', name: 'Claude' }
  ]

  return (
    <div className="h-screen w-full">
      <EnhancedChatInterface
        messages={messages}
        onSendMessage={handleSendMessage}
        onUpdateMessage={updateMessage}
        isLoading={isLoading}
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
      />
    </div>
  )
}

/*
INTEGRATION INSTRUCTIONS:

1. To integrate collaboration streaming in your existing conversation component:

```tsx
// Import the hook
import { useCollaborationStream } from '@/hooks/use-collaboration-stream'

// In your component:
const { startCollaboration } = useCollaborationStream({
  threadId: yourThreadId,
  orgId: yourOrgId, // optional
  onUpdateMessage: yourUpdateMessageFunction,
  onAddMessage: yourAddMessageFunction
})

// Trigger collaboration:
await startCollaboration(userMessage, 'auto') // or 'manual'
```

2. Your message state should support the collaboration field:

```tsx
interface Message {
  // ... existing fields
  collaboration?: {
    mode: "thinking" | "streaming_final" | "complete"
    stages: Array<{
      id: string
      label: string
      status: "pending" | "active" | "done"
    }>
    currentStageId?: string
  }
}
```

3. Pass onUpdateMessage to EnhancedChatInterface:

```tsx
<EnhancedChatInterface
  messages={messages}
  onSendMessage={handleSendMessage}
  onUpdateMessage={updateMessage} // Add this line
  // ... other props
/>
```

4. The ThinkingStream component will automatically render when a message
   has collaboration state, showing the animated thinking process inline.

*/ 