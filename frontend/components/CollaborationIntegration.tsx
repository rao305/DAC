"use client"

import { useState } from 'react'
import { CollaborateResult } from './collaborate/CollaborateResult'
import { threadCollaborate } from '@/app/actions/thread-collaborate'
import { CollaborateResponse } from '@/lib/collaborate-types'

interface CollaborationIntegrationProps {
  threadId: string
  onCollaborationResult?: (result: CollaborateResponse) => void
}

export function CollaborationIntegration({ 
  threadId, 
  onCollaborationResult 
}: CollaborationIntegrationProps) {
  const [message, setMessage] = useState('')
  const [isCollaborating, setIsCollaborating] = useState(false)
  const [result, setResult] = useState<CollaborateResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleCollaborate = async () => {
    if (!message.trim()) return

    setIsCollaborating(true)
    setError(null)

    try {
      const collaborationResult = await threadCollaborate(threadId, message, 'auto')
      setResult(collaborationResult)
      onCollaborationResult?.(collaborationResult)
    } catch (err) {
      console.error('Collaboration error:', err)
      setError(err instanceof Error ? err.message : 'Collaboration failed')
    } finally {
      setIsCollaborating(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Enhanced Multi-Model Collaboration
        </h1>
        <p className="text-gray-600 text-sm">
          Thread ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{threadId}</code>
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg border p-4 shadow-sm">
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Message
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Ask a question or request help with a complex topic..."
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows={3}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="text-xs text-gray-500">
              This will use your internal team (5 stages) + external reviewers (Perplexity, Gemini, GPT, Kimi, OpenRouter)
            </div>
            <button
              onClick={handleCollaborate}
              disabled={!message.trim() || isCollaborating}
              className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-sky-400 text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-600 hover:to-sky-500 transition-all"
            >
              {isCollaborating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Collaborating...</span>
                </div>
              ) : (
                'Collaborate'
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-red-500 text-sm">❌</span>
            <div>
              <div className="font-medium text-red-900 text-sm">Collaboration Failed</div>
              <div className="text-red-700 text-sm mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Results Display */}
      {result && (
        <div>
          <CollaborateResult data={result} />
        </div>
      )}

      {/* Demo Instructions */}
      {!result && !isCollaborating && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <span className="text-blue-500 text-sm">💡</span>
            <div>
              <div className="font-medium text-blue-900 text-sm mb-2">Try these example questions:</div>
              <div className="space-y-1 text-blue-800 text-sm">
                <div>• "Explain how to build a scalable microservices architecture"</div>
                <div>• "Compare React vs Vue.js for a new project"</div>
                <div>• "Design a data privacy strategy for a SaaS platform"</div>
                <div>• "Create a marketing plan for a B2B AI tool"</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}