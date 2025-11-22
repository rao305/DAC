"use client"

import { Brain, Copy, RefreshCw, Share2, Bookmark, Bug, ChevronDown } from "lucide-react"
import { InputArea } from "@/components/input-area"

export function ChatInterface() {
  return (
    <div className="flex-1 flex flex-col h-full relative">
      <div className="flex-1 overflow-y-auto p-4 md:p-0">
        <div className="max-w-3xl mx-auto pt-20 pb-40 space-y-8">
          {/* User Message */}
          <div className="flex justify-end">
            <div className="bg-zinc-800 text-zinc-100 px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[80%]">hi there</div>
          </div>

          {/* AI Message */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs text-zinc-400 ml-1 cursor-pointer hover:text-zinc-300 transition-colors w-fit">
              <Brain className="w-3.5 h-3.5" />
              <span>Chain of Thought</span>
              <ChevronDown className="w-3 h-3" />
            </div>

            <div className="text-zinc-100 leading-relaxed px-1">Hello! How can I help you today?</div>

            <div className="flex items-center gap-1 pt-1">
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-zinc-900/50 border border-zinc-800 text-xs text-zinc-400 hover:bg-zinc-800 hover:text-zinc-300 transition-colors cursor-pointer">
                <Brain className="w-3 h-3" />
                <span>GPT-OSS 20B</span>
              </div>

              <div className="flex items-center">
                <ActionButton icon={Copy} />
                <ActionButton icon={RefreshCw} />
                <ActionButton icon={Share2} />
                <ActionButton icon={Bookmark} />
                <ActionButton icon={Bug} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-950 via-zinc-950 to-transparent pt-10">
        <div className="max-w-3xl mx-auto">
          <InputArea />
          <div className="flex justify-end mt-2">
            <button className="p-2 text-zinc-500 hover:text-zinc-400 transition-colors rounded-full hover:bg-zinc-900">
              <div className="w-5 h-5 rounded-full border border-zinc-600 flex items-center justify-center text-[10px] font-bold">
                ?
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function ActionButton({ icon: Icon }: { icon: any }) {
  return (
    <button className="p-1.5 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50 rounded-md transition-colors">
      <Icon className="w-4 h-4" />
    </button>
  )
}
