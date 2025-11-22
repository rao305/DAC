"use client"

import { Clock, PanelLeft, ExternalLink, Plus, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"

interface SidebarProps {
  isCollapsed: boolean
  setIsCollapsed: (collapsed: boolean) => void
  history?: ChatHistoryItem[]
  onNewChat?: () => void
  onHistoryClick?: (id: string) => void
  user?: any
}

interface ChatHistoryItem {
  id: string
  firstLine: string
  timestamp: string
}

export function EnhancedSidebar({ 
  isCollapsed, 
  setIsCollapsed,
  history = [],
  onNewChat,
  onHistoryClick,
  user
}: SidebarProps) {
  return (
    <div
      className={cn(
        "h-full bg-black flex flex-col border-r border-zinc-800/50 transition-all duration-300 ease-in-out hidden md:flex",
        isCollapsed ? "w-[60px]" : "w-[260px]",
      )}
    >
      {/* Header */}
      <div className={cn("h-14 flex items-center px-3", isCollapsed ? "justify-center" : "justify-between")}>
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-zinc-900 cursor-pointer transition-colors group">
            <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full border-2 border-white/80" />
            </div>
            <span className="font-semibold text-zinc-200">DAC</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="text-zinc-400 hover:text-white hover:bg-zinc-900"
          onClick={() => setIsCollapsed(!isCollapsed)}
        >
          <PanelLeft className="w-5 h-5" />
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 py-2 px-2 space-y-2">
        <Button
          variant="ghost"
          onClick={onNewChat}
          className={cn(
            "w-full justify-start text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900",
            isCollapsed && "justify-center px-0",
          )}
        >
          <Plus className="w-5 h-5" />
          {!isCollapsed && <span className="ml-2">New chat</span>}
        </Button>

        {/* History Section */}
        {!isCollapsed && history.length > 0 && (
          <div className="space-y-1">
            <div className="flex items-center gap-2 px-2 py-1 text-xs text-zinc-500 uppercase tracking-wider">
              <Clock className="w-4 h-4" />
              <span>Recent</span>
            </div>
            <div className="space-y-1 max-h-[400px] overflow-y-auto">
              {history.slice(0, 20).map((item) => (
                <button
                  key={item.id}
                  onClick={() => onHistoryClick?.(item.id)}
                  className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:text-zinc-100 hover:bg-zinc-900 rounded-md transition-colors group"
                >
                  <div className="truncate">{item.firstLine}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">{item.timestamp}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 space-y-2 mt-auto">
        {isCollapsed ? (
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900"
          >
            <ExternalLink className="w-5 h-5" />
          </Button>
        ) : (
          <Button className="w-full bg-white text-black hover:bg-zinc-200 justify-center gap-2">
            <ExternalLink className="w-4 h-4" />
            Upgrade
          </Button>
        )}

        <div
          className={cn(
            "flex items-center gap-3 rounded-lg p-2 hover:bg-zinc-900 cursor-pointer transition-colors",
            isCollapsed && "justify-center px-0",
          )}
        >
          <Avatar className="h-8 w-8 bg-zinc-800 text-zinc-400 border border-zinc-700">
            <AvatarFallback>
              {user?.email ? user.email.charAt(0).toUpperCase() : 'G'}
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <>
              <div className="flex-1 overflow-hidden text-left">
                <p className="text-sm font-medium text-zinc-200 truncate">
                  {user?.email || 'Guest'}
                </p>
                <p className="text-xs text-zinc-500 truncate">
                  {user ? 'Online' : 'Sign In'}
                </p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-zinc-500" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}