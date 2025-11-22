"use client"

import {
  Paperclip,
  Search,
  ChevronDown,
  ArrowUp,
  Brain,
  Eye,
  Lock,
  Code,
  ImageIcon,
  MessageSquare,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"
import { SYNTRA_MODELS } from "@/components/syntra-model-selector"

interface EnhancedInputAreaProps {
  onSendMessage: (content: string) => void
  selectedModel: string
  onModelSelect: (modelId: string) => void
  isLoading?: boolean
}

export function EnhancedInputArea({ 
  onSendMessage, 
  selectedModel, 
  onModelSelect, 
  isLoading = false 
}: EnhancedInputAreaProps) {
  const [isModelOpen, setIsModelOpen] = useState(false)
  const [inputValue, setInputValue] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const selectedModelData = SYNTRA_MODELS.find(m => m.id === selectedModel) || SYNTRA_MODELS[0]

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSend = () => {
    console.log('🔧 handleSend called with inputValue:', inputValue)
    console.log('🔧 isLoading:', isLoading)
    
    if (!inputValue.trim() || isLoading) {
      console.log('❌ handleSend returning early - empty input or loading')
      return
    }
    
    console.log('📤 Calling onSendMessage with:', inputValue.trim())
    onSendMessage(inputValue.trim())
    setInputValue('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    console.log('⌨️ Key pressed:', e.key, 'Shift held:', e.shiftKey)
    if (e.key === 'Enter' && !e.shiftKey) {
      console.log('✅ Enter pressed, calling handleSend')
      e.preventDefault()
      handleSend()
    }
  }

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value)
    // Auto-resize textarea
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px'
  }

  const handleModelSelect = (modelId: string) => {
    onModelSelect(modelId)
    setIsModelOpen(false)
    setSearchQuery('')
  }

  const filteredModels = SYNTRA_MODELS.filter(model =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    model.description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const codingModels = filteredModels.filter(model => 
    model.features?.some(feature => 
      feature.toLowerCase().includes('code') || feature.toLowerCase().includes('coding')
    )
  )

  return (
    <div className="relative group">
      {/* Main Input Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-lg shadow-black/20">
        <textarea
          ref={textareaRef}
          value={inputValue}
          onChange={handleTextareaChange}
          onKeyDown={handleKeyDown}
          className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none min-h-[60px] text-base px-1"
          placeholder="How can I help you today?"
          disabled={isLoading}
        />

        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <button className="p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors">
              <Paperclip className="w-4 h-4" />
            </button>
            <button className="flex items-center gap-1 p-2 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors relative">
              <Search className="w-4 h-4" />
              <ChevronDown className="w-3 h-3" />
              <span className="absolute top-2 right-1.5 w-1.5 h-1.5 bg-red-500 rounded-full border border-zinc-900"></span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative" ref={dropdownRef}>
              {isModelOpen && (
                <div className="absolute bottom-full right-0 mb-2 w-[280px] overflow-hidden rounded-xl border border-zinc-700 bg-zinc-900 shadow-2xl animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2">
                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
                      <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-zinc-700 focus:outline-none"
                        placeholder="Search models..."
                      />
                    </div>

                    <div className="space-y-0.5">
                      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-800/50 cursor-not-allowed opacity-70">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <span className="text-xs">✨</span>
                          </div>
                          <span>Auto</span>
                        </div>
                        <Lock className="h-3.5 w-3.5" />
                      </div>

                      {filteredModels.map((model) => {
                        const Icon = model.icon
                        const isSelected = model.id === selectedModel
                        
                        return (
                          <div
                            key={model.id}
                            onClick={() => handleModelSelect(model.id)}
                            className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm cursor-pointer transition-colors ${
                              isSelected 
                                ? "bg-zinc-800 text-zinc-100" 
                                : "text-zinc-300 hover:bg-zinc-800"
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <div className="flex h-5 w-5 items-center justify-center">
                                <Icon className="h-4 w-4" />
                              </div>
                              <span>{model.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-zinc-400">
                              {model.features?.includes('Chain of thought') && (
                                <Brain className="h-3.5 w-3.5" />
                              )}
                              <Eye className="h-3.5 w-3.5" />
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {codingModels.length > 0 && (
                      <div className="mt-1 border-t border-zinc-800 pt-1">
                        <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer">
                          <div className="flex items-center gap-2">
                            <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                            <Code className="h-4 w-4" />
                            <span>Coding</span>
                          </div>
                          <span className="text-xs">{codingModels.length}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-zinc-800 bg-zinc-900/50 p-1">
                    <div className="grid grid-cols-2 gap-1 rounded-lg bg-zinc-950 p-1">
                      <button className="flex items-center justify-center gap-2 rounded-md bg-white py-1.5 text-xs font-medium text-black shadow-sm">
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat
                      </button>
                      <button className="flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium text-zinc-400 hover:text-zinc-200">
                        <ImageIcon className="h-3.5 w-3.5" />
                        Image
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setIsModelOpen(!isModelOpen)}
                className="flex items-center gap-2 px-3 py-1.5 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg text-xs text-zinc-300 transition-colors relative"
              >
                <selectedModelData.icon className="w-3.5 h-3.5" />
                <span>{selectedModelData.name}</span>
                <ChevronDown className="w-3 h-3" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-900"></span>
              </button>
            </div>

            <button 
              onClick={handleSend}
              disabled={!inputValue.trim() || isLoading}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}