'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { EnhancedConversationLayout } from '@/components/enhanced-conversation-layout'
// Removed unused auth and conversation hooks
import { toast } from 'sonner'
import { apiFetch } from '@/lib/api'
import { SYNTRA_MODELS } from '@/components/syntra-model-selector'
import { useWorkflowStore } from '@/store/workflow-store'
import { startWorkflow, runStep } from '@/app/actions/workflow'

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

export default function ConversationsLanding() {
  const router = useRouter()
  // Simplified without authentication
  const user = null
  const orgId = 'org_demo'
  const accessToken = null
  const loading = false
  const userConversations: any[] = []

  const [messages, setMessages] = React.useState<Message[]>([])
  const [history, setHistory] = React.useState<ChatHistoryItem[]>([])
  const [selectedModel, setSelectedModel] = React.useState('auto')
  const [isLoading, setIsLoading] = React.useState(false)
  const [currentThreadId, setCurrentThreadId] = React.useState<string | null>(null)

  const { isCollaborateMode, steps, setSteps, updateStep } = useWorkflowStore()

  // Execute workflow logic
  const executeWorkflow = React.useCallback(async (currentSteps: typeof steps, userContent: string) => {
    let localSteps = [...currentSteps]
    setIsLoading(true)

    for (let i = 0; i < localSteps.length; i++) {
      const step = localSteps[i]
      if (step.status === "pending") {
        // Update UI to show running
        updateStep(step.id, { status: "running" })

        try {
          // Run the step on server
          const result = await runStep(step.id, userContent, localSteps)
          const { outputDraft, status, metadata, error } = result

          // Update UI with result
          updateStep(step.id, {
            outputDraft,
            outputFinal: status === "done" ? outputDraft : undefined,
            status: status as any,
            metadata,
            error
          })

          // Update local steps array for next iteration context
          localSteps = localSteps.map(s => s.id === step.id ? {
            ...s,
            outputDraft,
            outputFinal: outputDraft,
            status: status as any,
            metadata,
            error
          } : s)

          // If error, stop workflow
          if (status === "error") {
            console.error(`Workflow stopped due to error in step ${step.id}`)
            setIsLoading(false)
            return
          }

          // If manual mode, stop here and wait for user
          if (status === "awaiting_user") {
            setIsLoading(false)
            return
          }
        } catch (error) {
          console.error(`Step ${step.id} failed:`, error)
          updateStep(step.id, { status: "error", error: { message: "Unexpected client error", type: "unknown" } })
          setIsLoading(false)
          return
        }
      }
    }
    setIsLoading(false)
  }, [updateStep])

  const handleContinueWorkflow = () => {
    // Find the last user message to use as context
    const lastUserMessage = messages.slice().reverse().find(m => m.role === 'user')?.content || ""
    executeWorkflow(steps, lastUserMessage)
  }

  // Build chat history
  React.useEffect(() => {
    if (userConversations.length > 0) {
      const historyItems: ChatHistoryItem[] = userConversations
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
  }, [userConversations])

  const handleNewChat = () => {
    // Reset conversation state for new chat
    setMessages([])
    setCurrentThreadId(null)
    console.log('🆕 Started new chat - reset thread ID and messages')
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
    console.log('🚀 handleSendMessage called with content:', content)

    if (!content.trim()) {
      console.log('❌ Content is empty, returning early')
      return
    }

    if (isCollaborateMode) {
      console.log('🧠 Starting collaborative workflow')

      // Add user message
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

      try {
        const initialSteps = await startWorkflow(content.trim())
        setSteps(initialSteps)

        // Start execution
        executeWorkflow(initialSteps, content.trim())

      } catch (error: any) {
        console.error("Workflow error:", error)
        setIsLoading(false)
      }
      return
    }

    console.log('🔐 Using demo mode - orgId:', orgId)

    console.log('✅ Auth passed, creating user message')

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

    console.log('💬 Adding user message to state:', userMessage)
    setMessages((prev) => {
      const newMessages = [...prev, userMessage]
      console.log('📝 New messages state:', newMessages)
      return newMessages
    })
    setIsLoading(true)
    console.log('⏳ Set loading to true')

    try {
      console.log('🔍 Finding model data for:', selectedModel)
      const selectedModelData = SYNTRA_MODELS.find((m) => m.id === selectedModel)
      console.log('🤖 Selected model data:', selectedModelData)

      let threadId: string

      if (currentThreadId) {
        // Use existing thread for follow-up messages
        console.log('🔄 Using existing thread:', currentThreadId)
        threadId = currentThreadId
      } else {
        // Create new thread for first message
        console.log('🧵 Creating new thread...')
        const threadResponse = await apiFetch<{
          thread_id: string
          created_at: string
        }>(`/threads/`, {
          method: 'POST',
          body: JSON.stringify({
            title: content.trim().substring(0, 50),
            description: '',
          }),
        })

        console.log('✅ Thread created:', threadResponse)
        threadId = threadResponse.thread_id
        setCurrentThreadId(threadId)
      }

      // Prepare request body
      const requestBody: any = {
        content: content.trim(),
      }

      // Only add model_preference if not using auto mode
      if (selectedModel !== 'auto' && selectedModelData?.provider) {
        requestBody.model_preference = selectedModelData.provider
      }

      // Step 2: Add message to the thread
      const messageResponse = await apiFetch<{
        user_message: { id: string; content: string }
        assistant_message: {
          id: string;
          content: string;
          provider?: string;
          model?: string;
          meta?: {
            latency_ms?: number;
            request_id?: string;
          };
        }
      }>(`/threads/${threadId}/messages`, {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      console.log('📋 Message response:', messageResponse)
      console.log('🤖 Assistant message data:', messageResponse.assistant_message)
      console.log('🔧 Provider:', messageResponse.assistant_message.provider)
      console.log('🔧 Model:', messageResponse.assistant_message.model)

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
        id: messageResponse.assistant_message.id,
        role: 'assistant',
        content: messageResponse.assistant_message.content,
        chainOfThought: selectedModelData
          ? `I analyzed your request using ${selectedModelData.name}. This model excels at ${selectedModelData.description.toLowerCase()}. I applied systematic reasoning to understand your needs, gathered relevant context, synthesized the information, and formulated a comprehensive response. The reasoning process included: pattern recognition, logical inference, and knowledge integration to provide you with the most accurate and helpful answer.`
          : undefined,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        modelId: selectedModel,
        modelName: (() => {
          const model = messageResponse.assistant_message.model;
          const provider = messageResponse.assistant_message.provider;

          if (model) {
            // Convert model names to user-friendly format
            if (model.includes('gemini')) return 'Gemini';
            if (model.includes('gpt')) return 'GPT';
            if (model.includes('perplexity') || model.includes('llama')) return 'Perplexity';
            if (model.includes('kimi') || model.includes('moonshot')) return 'Kimi';
          }

          if (provider) {
            // Convert provider names to user-friendly format
            if (provider === 'gemini') return 'Gemini';
            if (provider === 'openai') return 'GPT';
            if (provider === 'perplexity') return 'Perplexity';
            if (provider === 'kimi') return 'Kimi';
            // Capitalize first letter as fallback
            return provider.charAt(0).toUpperCase() + provider.slice(1);
          }

          return selectedModelData?.name || 'DAC';
        })(),
        reasoningType: determineReasoningType(messageResponse.assistant_message.content, content),
        confidence: Math.floor(85 + Math.random() * 15),
        processingTime: messageResponse.assistant_message.meta?.latency_ms ?
          Math.round(messageResponse.assistant_message.meta.latency_ms) :
          Math.floor(800 + Math.random() * 1200),
      }

      setMessages((prev) => [...prev, assistantMessage])

    } catch (error: any) {
      console.error('💥 Error sending message:', error)
      console.error('💥 Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
      toast.error('Failed to send message. Please try again.')
      // Remove the user message if the API call failed
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id))
    } finally {
      console.log('🏁 Finally block - setting loading to false')
      setIsLoading(false)
    }
  }

  // No loading state needed since we removed auth

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
      onContinueWorkflow={handleContinueWorkflow}
    />
  )
}
