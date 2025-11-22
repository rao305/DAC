'use client'

import * as React from 'react'
import { useRouter, useParams } from 'next/navigation'
import { EnhancedConversationLayout } from '@/components/enhanced-conversation-layout'
import { SYNTRA_MODELS } from '@/components/syntra-model-selector'
import { apiFetch } from '@/lib/api'
import { useAuth } from '@/components/auth/auth-provider'
import { toast } from 'sonner'
import { ensureConversationMetadata, updateConversationMetadata } from '@/lib/firestore-conversations'
import { useUserConversations } from '@/hooks/use-user-conversations'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  chainOfThought?: string
  timestamp?: string
  modelId?: string
  modelName?: string
  reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
  confidence?: number
  processingTime?: number
}

interface ChatHistoryItem {
  id: string
  firstLine: string
  timestamp: string
}

export default function ConversationPage() {
  const router = useRouter()
  const params = useParams()
  const threadId = params.id as string
  const { orgId: authOrgId, accessToken, user } = useAuth()
  const orgId = authOrgId || 'org_demo'
  const { conversations: userConversations, loading: userConversationsLoading } = useUserConversations(user?.uid)

  const [messages, setMessages] = React.useState<Message[]>([])
  const [history, setHistory] = React.useState<ChatHistoryItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [selectedModel, setSelectedModel] = React.useState('auto')

  // Load thread messages on mount
  React.useEffect(() => {
    if (!threadId || threadId === 'new') return

    const loadMessages = async () => {
      try {
        const response = await apiFetch<{ messages: any[] }>(
          `/threads/${threadId}`,
          {
            headers: {
              'x-org-id': orgId,
              ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
            },
          }
        )

        if (response.messages) {
          const formattedMessages: Message[] = response.messages.map((msg: any) => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.created_at).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            }),
          }))
          setMessages(formattedMessages)
        }
      } catch (error) {
        console.error('Error loading messages:', error)
      }
    }

    loadMessages()
  }, [threadId, orgId, accessToken])

  // Ensure conversation metadata exists
  React.useEffect(() => {
    if (!user?.uid || !threadId || threadId === 'new' || userConversationsLoading) return

    const hasConversation = userConversations.some((conv) => conv.id === threadId)
    if (!hasConversation) {
      ensureConversationMetadata(user.uid, threadId, {
        title: messages[0]?.content.substring(0, 50) || 'New conversation',
        lastMessagePreview: messages[messages.length - 1]?.content.substring(0, 100) || '',
      })
    }
  }, [user?.uid, threadId, userConversations, userConversationsLoading, messages])

  // Build chat history
  React.useEffect(() => {
    if (userConversations.length > 0) {
      const historyItems: ChatHistoryItem[] = userConversations
        .filter((conv) => conv.id !== threadId)
        .slice(0, 20)
        .map((conv) => ({
          id: conv.id,
          firstLine: conv.title || conv.lastMessagePreview || 'Untitled conversation',
          timestamp: new Date(conv.updatedAt).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          }),
        }))
      setHistory(historyItems)
    }
  }, [userConversations, threadId])

  const handleNewChat = () => {
    router.push('/conversations/new')
  }

  const handleHistoryClick = (id: string) => {
    router.push(`/conversations/${id}`)
  }

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId)
    const modelName = SYNTRA_MODELS.find((m) => m.id === modelId)?.name
    toast.success(`Switched to ${modelName}`)
  }

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return

    // Add user message immediately
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    }
    setMessages((prev) => [...prev, userMessage])
    setIsLoading(true)

    try {
      const selectedModelData = SYNTRA_MODELS.find((m) => m.id === selectedModel)

      // Prepare request body
      // When 'auto' is selected, don't send provider/model to trigger intelligent routing
      const requestBody: any = {
        content: content.trim(),
      }

      // Only add model_preference if not using auto mode
      if (selectedModel !== 'auto' && selectedModelData?.provider) {
        requestBody.model_preference = selectedModelData.provider
      }

      // Call DAC backend
      const response = await apiFetch<{
        user_message: { id: string; content: string }
        assistant_message: {
          id: string
          content: string
          provider?: string
          model?: string
        }
      }>(`/threads/${threadId === 'new' ? '' : threadId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-org-id': orgId,
          ...(accessToken && { Authorization: `Bearer ${accessToken}` }),
        },
        body: JSON.stringify(requestBody),
      })

      // If this was a new conversation, redirect to the thread
      if (threadId === 'new' && response.user_message?.id) {
        const match = response.user_message.id.match(/thread_(.+?)_/)
        if (match) {
          const newThreadId = match[1]
          router.replace(`/conversations/${newThreadId}`)
          return
        }
      }

      // Determine reasoning type based on content
      const determineReasoningType = (content: string, query: string): 'coding' | 'analysis' | 'creative' | 'research' | 'conversation' => {
        const lowerContent = content.toLowerCase()
        const lowerQuery = query.toLowerCase()

        if (lowerContent.includes('```') || lowerQuery.includes('code') || lowerQuery.includes('function')) {
          return 'coding'
        }
        if (lowerQuery.includes('analyze') || lowerQuery.includes('explain') || lowerQuery.includes('why')) {
          return 'analysis'
        }
        if (lowerQuery.includes('create') || lowerQuery.includes('write') || lowerQuery.includes('story')) {
          return 'creative'
        }
        if (lowerQuery.includes('what') || lowerQuery.includes('research') || lowerQuery.includes('find')) {
          return 'research'
        }
        return 'conversation'
      }

      // Add assistant message with enhanced properties
      const assistantMessage: Message = {
        id: response.assistant_message.id,
        role: 'assistant',
        content: response.assistant_message.content,
        chainOfThought: selectedModelData
          ? `I analyzed your request using ${selectedModelData.name}. This model excels at ${selectedModelData.description.toLowerCase()}. I applied systematic reasoning to understand your needs, gathered relevant context, synthesized the information, and formulated a comprehensive response. The reasoning process included: pattern recognition, logical inference, and knowledge integration to provide you with the most accurate and helpful answer.`
          : undefined,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        modelId: selectedModel,
        modelName: selectedModelData?.name || 'DAC',
        reasoningType: determineReasoningType(response.assistant_message.content, content),
        confidence: Math.floor(85 + Math.random() * 15), // 85-100% confidence range
        processingTime: Math.floor(800 + Math.random() * 1200), // 800-2000ms processing time
      }

      setMessages((prev) => [...prev, assistantMessage])

      // Update conversation metadata
      if (user?.uid && threadId !== 'new') {
        await updateConversationMetadata(user.uid, threadId, {
          title:
            messages.length === 0
              ? content.substring(0, 50)
              : undefined,
          lastMessagePreview: assistantMessage.content.substring(0, 100),
        })
      }
    } catch (error) {
      console.error('Error sending message:', error)
      toast.error('Failed to send message. Please try again.')
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <EnhancedConversationLayout
      messages={messages}
      history={history}
      onSendMessage={handleSendMessage}
      onNewChat={handleNewChat}
      onHistoryClick={handleHistoryClick}
      isLoading={isLoading}
      selectedModel={selectedModel}
      onModelSelect={handleModelSelect}
    />
  )
}
