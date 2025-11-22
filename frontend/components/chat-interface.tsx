"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Send, Copy, CheckCircle } from "lucide-react"

interface Message {
  id: string
  role: "user" | "agent"
  content: string
  timestamp: Date
}

export function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "agent",
      content:
        "Hello! I'm your Syntra AI Agent. I can help you with customer support, data analysis, content generation, and more. What would you like to explore?",
      timestamp: new Date(),
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim()) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // Simulate agent response
    setTimeout(() => {
      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: generateAgentResponse(input),
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, agentMessage])
      setIsLoading(false)
    }, 800)
  }

  const generateAgentResponse = (userInput: string): string => {
    const responses: { [key: string]: string } = {
      help: "I can assist with: customer support automation, sales intelligence, content generation, compliance monitoring, and data analysis. What would you like to learn more about?",
      customer:
        "With Syntra, I can handle customer support by automatically categorizing inquiries, routing to specialists, and providing instant responses to common questions. This reduces response time by 80%.",
      sales:
        "I can help with sales by scoring leads, automating follow-ups, and analyzing sales data. Teams using Syntra agents see 3x faster sales cycles.",
      security:
        "Enterprise security is built into Syntra with encryption, audit trails, compliance controls, and real-time monitoring. Your agents are production-ready.",
      pricing:
        "We offer flexible pricing starting with a Starter plan for small teams, Professional for growing businesses, and Enterprise for large deployments. Contact sales for custom quotes.",
      default:
        "That's a great question! Syntra provides enterprise-grade infrastructure for AI agents with built-in security, monitoring, and scalability. Can you tell me more about your specific use case?",
    }

    const lowerInput = userInput.toLowerCase()
    for (const [key, response] of Object.entries(responses)) {
      if (lowerInput.includes(key)) return response
    }
    return responses.default
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="flex flex-col h-full bg-background rounded-lg border border-border overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
            {message.role === "agent" && (
              <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0 text-accent text-sm font-bold">
                A
              </div>
            )}
            <div
              className={`max-w-sm lg:max-w-md xl:max-w-lg p-4 rounded-lg group relative ${
                message.role === "user"
                  ? "bg-accent text-primary rounded-br-none"
                  : "bg-card border border-border text-foreground rounded-bl-none"
              }`}
            >
              <p className="text-sm leading-relaxed">{message.content}</p>
              <button
                onClick={() => copyToClipboard(message.content, message.id)}
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-background/20 rounded"
                title="Copy message"
              >
                {copiedId === message.id ? <CheckCircle size={16} /> : <Copy size={16} />}
              </button>
            </div>
            {message.role === "user" && (
              <div className="w-8 h-8 rounded-lg bg-primary text-background flex items-center justify-center flex-shrink-0 text-sm font-bold">
                Y
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center flex-shrink-0">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            </div>
            <div className="bg-card border border-border p-4 rounded-lg rounded-bl-none">
              <p className="text-sm text-muted-foreground">Thinking...</p>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t border-border/50 p-6 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="How can I help you today?"
              className="w-full px-4 py-3 pr-12 rounded-2xl bg-muted/50 border border-border/60 text-foreground placeholder:text-muted-foreground/70 focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent/50 transition-all duration-200 text-sm resize-none shadow-sm hover:bg-muted/70"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <Button
                type="submit"
                disabled={!input.trim() || isLoading}
                size="sm"
                className="h-8 w-8 p-0 rounded-lg bg-foreground hover:bg-foreground/90 text-background shadow-sm disabled:opacity-40"
              >
                <Send size={16} />
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
