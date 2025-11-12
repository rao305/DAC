'use client'

import { useState, useEffect, useRef } from 'react'
import dynamic from 'next/dynamic'
import { apiFetch, ApiError } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Send, Copy, CheckCircle, AlertCircle, Square } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { TypingIndicator } from '@/components/typing-indicator'

type Provider = 'perplexity' | 'openai' | 'gemini' | 'openrouter'
type ScopeOption = 'private' | 'shared'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  provider?: Provider
  model?: string
  reason?: string
}

interface RouterResponse {
  provider: Provider
  model: string
  reason: string
}

interface SendMessageResponse {
  user_message: {
    id: string
    content: string
    role: string
    created_at: string
  }
  assistant_message: {
    id: string
    content: string
    role: string
    created_at: string
    provider?: string
    model?: string
  }
}

const PROVIDER_COLORS: Record<Provider, string> = {
  perplexity: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  openai: 'bg-green-500/20 text-green-300 border-green-500/30',
  gemini: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  openrouter: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const PROVIDER_LABELS: Record<Provider, string> = {
  perplexity: 'Perplexity',
  openai: 'OpenAI',
  gemini: 'Gemini',
  openrouter: 'OpenRouter',
}

export default function ThreadsPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [threadId, setThreadId] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [scope, setScope] = useState<ScopeOption>('private')
  const [rateLimitMessage, setRateLimitMessage] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [streamingEnabled, setStreamingEnabled] = useState(true)
  const [currentRequestId, setCurrentRequestId] = useState<string | null>(null)
  const [streamingContent, setStreamingContent] = useState('')
  const abortControllerRef = useRef<AbortController | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const orgId = 'org_demo' // Dev mode: use demo org

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleCancelRequest = async () => {
    if (currentRequestId) {
      try {
        await apiFetch(`/threads/cancel/${currentRequestId}`, orgId, {
          method: 'POST',
        })
      } catch (err) {
        console.error('Failed to cancel request:', err)
      }
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    setSending(false)
    setCurrentRequestId(null)
    setStreamingContent('')
  }

  const handleSendMessage = async () => {
    const trimmed = input.trim()
    if (!trimmed || sending) return

    setError(null)
    setRateLimitMessage(null)

    const optimisticId = `msg_${Date.now()}`
    const contextSize = messages.length
    const optimisticMessage: Message = {
      id: optimisticId,
      role: 'user',
      content: trimmed,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, optimisticMessage])
    setInput('')
    setSending(true)

    try {
      let currentThreadId = threadId
      if (!currentThreadId) {
        const threadResponse = await apiFetch('/threads/', orgId, {
          method: 'POST',
          body: JSON.stringify({
            title: trimmed.substring(0, 50),
          }),
        })
        const threadData = await threadResponse.json()
        currentThreadId = threadData.thread_id
        setThreadId(currentThreadId)
      }

      const routerResponse = await apiFetch('/router/choose', orgId, {
        method: 'POST',
        body: JSON.stringify({
          message: trimmed,
          context_size: contextSize,
          thread_id: currentThreadId,
        }),
      })

      const routerData: RouterResponse = await routerResponse.json()
      const chosenProvider = routerData.provider

      if (streamingEnabled) {
        // Use streaming endpoint
        abortControllerRef.current = new AbortController()
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'
        
        const response = await fetch(`${apiUrl}/threads/${currentThreadId}/messages/stream`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-org-id': orgId,
          },
          body: JSON.stringify({
            content: trimmed,
            role: 'user',
            provider: chosenProvider,
            model: routerData.model,
            reason: routerData.reason,
            scope,
          }),
          signal: abortControllerRef.current.signal,
        })

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }

        const reader = response.body?.getReader()
        const decoder = new TextDecoder()
        let buffer = ''
        let assistantContent = ''
        let assistantMessageId = ''
        let requestId = ''

        // Add streaming placeholder message
        const streamingMsgId = `streaming_${Date.now()}`
        setMessages((prev) => [...prev, {
          id: streamingMsgId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          provider: chosenProvider,
          model: routerData.model,
          reason: routerData.reason,
        }])

        if (reader) {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })

            // Parse SSE frames (separated by \n\n)
            let idx
            while ((idx = buffer.indexOf('\n\n')) >= 0) {
              const frame = buffer.slice(0, idx)
              buffer = buffer.slice(idx + 2)

              let event = 'message'
              let data = '{}'

              // Parse event and data lines
              for (const line of frame.split('\n')) {
                if (line.startsWith('event:')) {
                  event = line.slice(6).trim()
                } else if (line.startsWith('data:')) {
                  data = line.slice(5).trim()
                }
              }

              try {
                const json = data ? JSON.parse(data) : {}

                // Handle meta events (including TTFT)
                if (event === 'meta' && json.ttft_ms) {
                  // TTFT received - could log or display
                  console.log(`TTFT: ${json.ttft_ms}ms`)
                }

                // Handle delta events
                if (event === 'delta' && json.delta) {
                  assistantContent += json.delta
                  setStreamingContent(assistantContent)
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingMsgId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  )
                }

                // Handle done event
                if (event === 'done') {
                  if (json.message?.id) {
                    assistantMessageId = json.message.id
                  }
                  break
                }

                // Handle error event
                if (event === 'error') {
                  throw new Error(json.error || 'Stream error')
                }

                // Handle cancelled event
                if (event === 'cancelled') {
                  setMessages((prev) => prev.filter((msg) => msg.id !== streamingMsgId))
                  return
                }

                // Legacy: handle old format
                if (json.type === 'request_id') {
                  requestId = json.request_id
                  setCurrentRequestId(requestId)
                } else if (json.type === 'content') {
                  assistantContent += json.content
                  setStreamingContent(assistantContent)
                  setMessages((prev) =>
                    prev.map((msg) =>
                      msg.id === streamingMsgId
                        ? { ...msg, content: assistantContent }
                        : msg
                    )
                  )
                } else if (json.type === 'done' && json.message?.id) {
                  assistantMessageId = json.message.id
                }
              } catch (parseErr) {
                console.error('Failed to parse SSE data:', parseErr)
              }
            }
          }
        }

        // Update with final message ID
        if (assistantMessageId) {
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === streamingMsgId
                ? { ...msg, id: assistantMessageId }
                : msg
            )
          )
        }

      } else {
        // Use non-streaming endpoint (legacy)
        const sendResponse = await apiFetch(`/threads/${currentThreadId}/messages`, orgId, {
          method: 'POST',
          body: JSON.stringify({
            content: trimmed,
            role: 'user',
            provider: chosenProvider,
            model: routerData.model,
            reason: routerData.reason,
            scope,
          }),
        })

        const sendData: SendMessageResponse = await sendResponse.json()

        const userFromServer: Message = {
          id: sendData.user_message.id,
          role: 'user',
          content: sendData.user_message.content,
          timestamp: new Date(sendData.user_message.created_at),
        }

        const assistantFromServer: Message = {
          id: sendData.assistant_message.id,
          role: 'assistant',
          content: sendData.assistant_message.content,
          timestamp: new Date(sendData.assistant_message.created_at),
          provider: sendData.assistant_message.provider as Provider,
          model: sendData.assistant_message.model,
          reason: routerData.reason,
        }

        setMessages((prev) => {
          const replaced = prev.map((msg) => (msg.id === optimisticId ? userFromServer : msg))
          return [...replaced, assistantFromServer]
        })
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        // Request was cancelled
        return
      }
      if (err instanceof ApiError) {
        if (err.status === 429) {
          setRateLimitMessage('Rate limit exceeded. Please try again later.')
        } else {
          setError(err.message)
        }
      } else {
        setError('Failed to send message. Please try again.')
      }
      setMessages((prev) => prev.filter((msg) => msg.id !== optimisticId))
    } finally {
      setSending(false)
      setCurrentRequestId(null)
      setStreamingContent('')
      abortControllerRef.current = null
    }
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Threads</h1>
            <p className="text-muted-foreground">Cross-LLM conversation hub</p>
          </div>

          {rateLimitMessage && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{rateLimitMessage}</AlertDescription>
            </Alert>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex items-center justify-between p-4 bg-card border border-border rounded-lg">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <Label htmlFor="scope-toggle" className="text-sm font-medium">
                  Forward Scope:
                </Label>
                <div className="flex items-center gap-2">
                  <span className={`text-sm ${scope === 'private' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Private only
                  </span>
                  <Switch
                    id="scope-toggle"
                    checked={scope === 'shared'}
                    onCheckedChange={(checked) => setScope(checked ? 'shared' : 'private')}
                  />
                  <span className={`text-sm ${scope === 'shared' ? 'text-foreground' : 'text-muted-foreground'}`}>
                    Allow shared
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Label htmlFor="streaming-toggle" className="text-sm font-medium">
                  Streaming:
                </Label>
                <Switch
                  id="streaming-toggle"
                  checked={streamingEnabled}
                  onCheckedChange={setStreamingEnabled}
                  disabled={sending}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col h-[600px] bg-background rounded-lg border border-border overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {messages.length === 0 && (
                <div className="text-center text-muted-foreground py-12">
                  <p className="text-lg mb-2">Start a conversation</p>
                  <p className="text-sm">Send a message to begin chatting with AI agents</p>
                </div>
              )}
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 text-accent text-sm font-bold">
                      AI
                    </div>
                  )}
                  <div
                    className={`max-w-sm lg:max-w-md xl:max-w-lg p-4 rounded-lg group relative ${
                      message.role === 'user'
                        ? 'bg-accent text-primary rounded-br-none'
                        : 'bg-card border border-border text-foreground rounded-bl-none'
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                    {message.provider && (
                      <div className="mt-2 flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${PROVIDER_COLORS[message.provider] || 'bg-gray-500/20 text-gray-300'}`}
                        >
                          {PROVIDER_LABELS[message.provider] || message.provider}
                        </Badge>
                        {message.reason && (
                          <span className="text-xs text-muted-foreground">({message.reason})</span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => copyToClipboard(message.content, message.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/20 rounded"
                      title="Copy message"
                    >
                      {copiedId === message.id ? (
                        <CheckCircle size={16} className="text-green-500" />
                      ) : (
                        <Copy size={16} />
                      )}
                    </button>
                  </div>
                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-lg bg-primary text-background flex items-center justify-center flex-shrink-0 text-sm font-bold">
                      U
                    </div>
                  )}
                </div>
              ))}
              {sending && <TypingIndicator />}
              <div ref={messagesEndRef} />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSendMessage()
              }}
              className="border-t border-border p-4 bg-card/30"
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 rounded-lg bg-input border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-0"
                  disabled={sending}
                />
                {sending ? (
                  <Button type="button" onClick={handleCancelRequest} variant="destructive" className="px-4">
                    <Square size={18} />
                  </Button>
                ) : (
                  <Button type="submit" disabled={!input.trim()} className="px-4">
                    <Send size={18} />
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

