"use client"

import { Brain, Copy, RefreshCw, Share2, Bookmark, Bug, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { ImageInputArea } from "@/components/image-input-area"
import { EnhancedMessageContent } from "@/components/enhanced-message-content"
import { CodePanel } from "@/components/code-panel"
import { AgentStatusRow } from "@/components/collab/AgentStatusRow"
import { StepCard } from "@/components/collab/StepCard"
import { useWorkflowStore } from "@/store/workflow-store"

interface ImageFile {
  file?: File
  url: string
  id: string
}

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  images?: ImageFile[]
  chainOfThought?: string
  timestamp?: string
  modelId?: string
  modelName?: string
  reasoningType?: 'coding' | 'analysis' | 'creative' | 'research' | 'conversation'
  confidence?: number
  processingTime?: number
}

interface ChatInterfaceProps {
  messages: Message[]
  onSendMessage: (content: string, images?: ImageFile[]) => void
  isLoading?: boolean
  selectedModel: string
  onModelSelect: (modelId: string) => void
  onContinueWorkflow?: () => void
}

export function EnhancedChatInterface({
  messages,
  onSendMessage,
  isLoading = false,
  selectedModel,
  onModelSelect,
  onContinueWorkflow
}: ChatInterfaceProps) {
  const [expandedThoughts, setExpandedThoughts] = useState<Set<string>>(new Set())
  const [codePanelOpen, setCodePanelOpen] = useState(false)
  const [codePanelContent, setCodePanelContent] = useState({ code: '', language: '', title: '' })

  const { isCollaborateMode, steps, updateStep } = useWorkflowStore()

  const toggleThought = (messageId: string) => {
    const newExpanded = new Set(expandedThoughts)
    if (newExpanded.has(messageId)) {
      newExpanded.delete(messageId)
    } else {
      newExpanded.add(messageId)
    }
    setExpandedThoughts(newExpanded)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleCodePanelOpen = (code: string, language: string, title?: string) => {
    setCodePanelContent({
      code,
      language,
      title: title || `${language.toUpperCase()} Code`
    })
    setCodePanelOpen(true)
  }

  const getReasoningTypeColor = (type?: string) => {
    switch (type) {
      case 'coding': return 'text-blue-400'
      case 'analysis': return 'text-green-400'
      case 'creative': return 'text-purple-400'
      case 'research': return 'text-yellow-400'
      default: return 'text-zinc-400'
    }
  }

  const getReasoningTypeIcon = (type?: string) => {
    switch (type) {
      case 'coding': return '💻'
      case 'analysis': return '🔍'
      case 'creative': return '🎨'
      case 'research': return '📚'
      default: return '💭'
    }
  }

  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-0">
        <div className="max-w-3xl mx-auto pt-20 pb-40 space-y-8">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center">
                <Brain className="w-8 h-8 text-zinc-400" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-200">
                How can I help you today?
              </h2>
              <p className="text-zinc-400 max-w-md">
                I'm your AI assistant powered by DAC. Ask me anything and I'll reason through it step by step.
              </p>
            </div>
          )}

          {isCollaborateMode && (
            <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2 text-sm font-medium text-zinc-200 bg-zinc-900/50 px-3 py-1.5 rounded-full border border-zinc-800">
                  <span className="text-lg animate-pulse">🧠</span>
                  <span>AI Team is collaborating...</span>
                </div>
              </div>
              <AgentStatusRow steps={steps} />

              <div className="mt-6 space-y-4">
                {steps.map((step, index) => (
                  <StepCard
                    key={step.id}
                    step={step}
                    index={index}
                    total={steps.length}
                    onApprove={(id, content) => {
                      updateStep(id, { status: "done", outputFinal: content })
                      if (onContinueWorkflow) {
                        onContinueWorkflow()
                      }
                    }}
                    onRegenerate={(id) => {
                      updateStep(id, { status: "running", outputDraft: undefined })
                      // Trigger regenerate logic
                    }}
                    onCancel={() => {
                      updateStep(step.id, { status: "cancelled" })
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={message.role === 'user' ? "space-y-2" : "space-y-2"}>
              {message.role === 'user' ? (
                <div className="flex justify-end">
                  <div className="max-w-[80%] text-zinc-100 leading-relaxed text-right">
                    <div className="text-xs text-zinc-400 mb-1">You</div>
                    {message.content}
                  </div>
                </div>
              ) : (
                <div className="flex justify-start">
                  <div className="max-w-[90%]">
                    {/* Chain of Thought Toggle */}
                    {message.chainOfThought && (
                      <div
                        className="flex items-center gap-2 text-xs text-zinc-400 ml-1 cursor-pointer hover:text-zinc-300 transition-colors w-fit"
                        onClick={() => toggleThought(message.id)}
                      >
                        <Brain className="w-3.5 h-3.5" />
                        <span>Chain of Thought</span>
                        {expandedThoughts.has(message.id) ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </div>
                    )}

                    {/* Expanded Chain of Thought */}
                    {message.chainOfThought && expandedThoughts.has(message.id) && (
                      <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 ml-1 text-sm text-zinc-300 leading-relaxed">
                        {message.chainOfThought}
                      </div>
                    )}

                    {/* Message Content */}
                    <div className="text-zinc-100 leading-relaxed px-1">
                      <EnhancedMessageContent
                        content={message.content}
                        role={message.role}
                        images={message.images}
                        onCodePanelOpen={handleCodePanelOpen}
                      />
                    </div>

                    {/* Message Actions */}
                    <div className="flex items-center gap-1 pt-1">
                      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors cursor-pointer">
                        <Brain className="w-3 h-3" />
                        <span>{message.modelName || 'DAC'}</span>
                        {message.confidence && (
                          <span className="text-green-400">{message.confidence}%</span>
                        )}
                        {message.processingTime && (
                          <span className="text-blue-400">{message.processingTime}ms</span>
                        )}
                      </div>

                      <div className="flex items-center">
                        <ActionButton
                          icon={Copy}
                          onClick={() => copyToClipboard(message.content)}
                          tooltip="Copy message"
                        />
                        <ActionButton
                          icon={RefreshCw}
                          tooltip="Regenerate"
                        />
                        <ActionButton
                          icon={Share2}
                          tooltip="Share"
                        />
                        <ActionButton
                          icon={Bookmark}
                          tooltip="Bookmark"
                        />
                        <ActionButton
                          icon={Bug}
                          tooltip="Report issue"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="max-w-[90%] space-y-2">
                <div className="flex items-center gap-2 text-xs text-zinc-400 ml-1">
                  <Brain className="w-3.5 h-3.5 animate-pulse" />
                  <span>Thinking...</span>
                </div>
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3 ml-1">
                  <div className="flex items-center gap-2 text-sm text-zinc-400">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                      <div className="w-2 h-2 bg-zinc-500 rounded-full animate-bounce"></div>
                    </div>
                    <span>Processing your request</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Input Area */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10">
        <div className="max-w-3xl mx-auto">
          <ImageInputArea
            onSendMessage={onSendMessage}
            selectedModel={selectedModel}
            onModelSelect={onModelSelect}
            isLoading={isLoading}
          />
          <div className="flex justify-end mt-2">
            <button className="p-2 text-zinc-500 hover:text-zinc-400 transition-colors rounded-full hover:bg-zinc-900">
              <div className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] font-bold">
                ?
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Code Panel */}
      <CodePanel
        isOpen={codePanelOpen}
        onClose={() => setCodePanelOpen(false)}
        code={codePanelContent.code}
        language={codePanelContent.language}
        title={codePanelContent.title}
      />
    </div>
  )
}

function ActionButton({
  icon: Icon,
  onClick,
  tooltip
}: {
  icon: any,
  onClick?: () => void,
  tooltip?: string
}) {
  return (
    <button
      className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors"
      onClick={onClick}
      title={tooltip}
    >
      <Icon className="w-4 h-4" />
    </button>
  )
}