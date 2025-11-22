"use client"

import {
  Paperclip,
  Search,
  ChevronDown,
  ArrowUp,
  Globe,
  Brain,
  Eye,
  Lock,
  Code,
  ImageIcon,
  MessageSquare,
} from "lucide-react"
import { useState, useRef, useEffect } from "react"

export function InputArea() {
  const [isModelOpen, setIsModelOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="relative group">
      {/* Main Input Container */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 focus-within:ring-1 focus-within:ring-zinc-700 transition-all shadow-lg shadow-black/20">
        <textarea
          className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-500 resize-none outline-none min-h-[60px] text-base px-1"
          placeholder="How can I help you today?"
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

                      <div className="flex items-center justify-between rounded-lg bg-zinc-800 px-2 py-2 text-sm text-zinc-100 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <Brain className="h-4 w-4" />
                          </div>
                          <span>GPT-OSS 20B</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-zinc-400">
                          <Brain className="h-3.5 w-3.5" />
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                      </div>

                      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <span className="font-bold text-xs">∞</span>
                          </div>
                          <span>Llama 3.3</span>
                        </div>
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      </div>

                      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <span className="font-bold text-xs">Q</span>
                          </div>
                          <span>Qwen 2.5</span>
                        </div>
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      </div>

                      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-300 hover:bg-zinc-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <div className="flex h-5 w-5 items-center justify-center">
                            <span className="font-bold text-xs">M</span>
                          </div>
                          <span>Mistral Small</span>
                        </div>
                        <Eye className="h-3.5 w-3.5 text-zinc-500" />
                      </div>
                    </div>

                    <div className="mt-1 border-t border-zinc-800 pt-1">
                      <div className="flex items-center justify-between rounded-lg px-2 py-2 text-sm text-zinc-400 hover:bg-zinc-800 cursor-pointer">
                        <div className="flex items-center gap-2">
                          <ChevronDown className="h-3.5 w-3.5 -rotate-90" />
                          <Code className="h-4 w-4" />
                          <span>Coding</span>
                        </div>
                        <span className="text-xs">5</span>
                      </div>
                    </div>
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
                <Globe className="w-3.5 h-3.5" />
                <span>GPT-OSS 20B</span>
                <ChevronDown className="w-3 h-3" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border-2 border-zinc-900"></span>
              </button>
            </div>

            <button className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-lg transition-colors">
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
