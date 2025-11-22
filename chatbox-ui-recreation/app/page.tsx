"use client"

import { ChatInterface } from "@/components/chat-interface"
import { Sidebar } from "@/components/sidebar"
import { useState } from "react"

export default function Page() {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full bg-zinc-900 text-zinc-50 overflow-hidden font-sans">
      <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <main className="flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out">
        <header className="absolute top-4 right-4 z-10 flex gap-2">
          <button className="px-4 py-2 text-sm font-medium text-zinc-200 hover:text-white transition-colors">
            Log in
          </button>
          <button className="px-4 py-2 text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-white rounded-md border border-zinc-700 transition-colors">
            Sign up for free
          </button>
        </header>
        <ChatInterface />
      </main>
    </div>
  )
}
