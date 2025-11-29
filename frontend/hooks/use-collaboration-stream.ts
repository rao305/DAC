"use client"

import { useCallback } from 'react'

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
  collaboration?: CollaborationState
  [key: string]: any
}

interface SSEEvent {
  type: 'stage_start' | 'stage_end' | 'final_chunk' | 'done' | 'error'
  stage_id?: string
  text?: string
  message?: any
  error?: string
}

interface UseCollaborationStreamProps {
  threadId: string
  orgId?: string
  onUpdateMessage: (messageId: string, updates: Partial<Message>) => void
  onAddMessage: (message: Message) => void
}

export function useCollaborationStream({
  threadId,
  orgId,
  onUpdateMessage,
  onAddMessage
}: UseCollaborationStreamProps) {

  const startCollaboration = useCallback(async (
    userMessage: string,
    mode: "auto" | "manual" = "auto"
  ) => {
    // Create initial collaboration message with thinking state
    const collaborationMessageId = `collab_${Date.now()}`
    
    const initialStages: CollaborationStage[] = [
      { id: "analyst", label: "Analyzing the problem…", status: "active" },
      { id: "researcher", label: "Looking up relevant information…", status: "pending" },
      { id: "creator", label: "Drafting a solution…", status: "pending" },
      { id: "critic", label: "Checking for issues…", status: "pending" },
      { id: "reviews", label: "External experts reviewing…", status: "pending" },
      { id: "director", label: "Synthesizing final answer…", status: "pending" }
    ]

    const initialMessage: Message = {
      id: collaborationMessageId,
      role: 'assistant',
      content: '',
      collaboration: {
        mode: "thinking",
        stages: initialStages,
        currentStageId: "analyst"
      },
      timestamp: new Date().toISOString(),
      modelName: 'Syntra Collaborate',
      reasoningType: 'analysis'
    }

    // Add the initial collaboration message to the chat
    onAddMessage(initialMessage)

    // Start SSE connection
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8002'
    const sseUrl = `${baseUrl}/api/collaboration/${threadId}/collaborate/stream`
    
    // Include org_id in headers if available
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (orgId) {
      headers['X-Org-ID'] = orgId
    }

    const response = await fetch(sseUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        message: userMessage,
        mode: mode
      })
    })

    if (!response.ok) {
      throw new Error(`Collaboration failed: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    const decoder = new TextDecoder()

    if (!reader) {
      throw new Error('Failed to create stream reader')
    }

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value, { stream: true })
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData: SSEEvent = JSON.parse(line.slice(6))
              await handleSSEEvent(collaborationMessageId, eventData)
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e)
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }
  }, [threadId, orgId, onUpdateMessage, onAddMessage])

  const handleSSEEvent = useCallback(async (
    messageId: string,
    event: SSEEvent
  ) => {
    switch (event.type) {
      case 'stage_start':
        if (event.stage_id) {
          onUpdateMessage(messageId, {
            collaboration: (prevMessage: Message) => {
              if (!prevMessage.collaboration) return undefined
              
              const updatedStages = prevMessage.collaboration.stages.map(stage => ({
                ...stage,
                status: stage.id === event.stage_id 
                  ? "active" as const
                  : stage.status === "active" 
                    ? "done" as const 
                    : stage.status
              }))

              return {
                ...prevMessage.collaboration,
                stages: updatedStages,
                currentStageId: event.stage_id
              }
            }
          } as any)
        }
        break

      case 'stage_end':
        if (event.stage_id) {
          onUpdateMessage(messageId, {
            collaboration: (prevMessage: Message) => {
              if (!prevMessage.collaboration) return undefined
              
              const updatedStages = prevMessage.collaboration.stages.map(stage => ({
                ...stage,
                status: stage.id === event.stage_id ? "done" as const : stage.status
              }))

              return {
                ...prevMessage.collaboration,
                stages: updatedStages
              }
            }
          } as any)
        }
        break

      case 'final_chunk':
        if (event.text) {
          onUpdateMessage(messageId, {
            content: (prevMessage: Message) => (prevMessage.content || '') + event.text,
            collaboration: (prevMessage: Message) => {
              if (!prevMessage.collaboration) return undefined
              return {
                ...prevMessage.collaboration,
                mode: "streaming_final" as const
              }
            }
          } as any)
        }
        break

      case 'done':
        if (event.message) {
          // Update to final completed state
          onUpdateMessage(messageId, {
            id: event.message.id,
            content: event.message.content,
            collaboration: (prevMessage: Message) => {
              if (!prevMessage.collaboration) return undefined
              return {
                ...prevMessage.collaboration,
                mode: "complete" as const,
                stages: prevMessage.collaboration.stages.map(stage => ({
                  ...stage,
                  status: "done" as const
                }))
              }
            },
            provider: event.message.provider,
            modelName: event.message.model || 'Syntra Collaborate'
          } as any)
        }
        break

      case 'error':
        console.error('Collaboration error:', event.error)
        onUpdateMessage(messageId, {
          content: `Error: ${event.error || 'Collaboration failed'}`,
          collaboration: (prevMessage: Message) => {
            if (!prevMessage.collaboration) return undefined
            return {
              ...prevMessage.collaboration,
              mode: "complete" as const
            }
          }
        } as any)
        break

      default:
        console.warn('Unknown SSE event type:', event.type)
    }
  }, [onUpdateMessage])

  return {
    startCollaboration
  }
}