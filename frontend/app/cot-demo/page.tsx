'use client'

import * as React from 'react'
import { OkaraMessageBubble } from '@/components/okara-v2-message-bubble'
import { OkaraHeader } from '@/components/okara-v2-header'
import { OkaraSidebarV2 } from '@/components/okara-v2-sidebar'

export default function ChainOfThoughtDemoPage() {
  const [selectedModel, setSelectedModel] = React.useState('kimi-k2-thinking')
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  const sampleMessages = [
    {
      role: 'user' as const,
      content: 'Tell me how chain of thought reasoning works',
      timestamp: '2:34 PM'
    },
    {
      role: 'assistant' as const,
      content: `Chain of thought reasoning is a powerful technique where AI models break down complex problems into step-by-step logical sequences. This approach allows for more transparent and accurate problem-solving by making the reasoning process visible.

## Key Benefits

- **Transparency**: You can see exactly how the AI arrived at its conclusion
- **Accuracy**: Step-by-step reasoning reduces errors in complex problems  
- **Debugging**: When something goes wrong, you can identify exactly where
- **Trust**: Understanding the reasoning builds confidence in the results

This approach is particularly effective for mathematical problems, logical puzzles, and complex analysis tasks.`,
      chainOfThought: `To explain chain of thought reasoning effectively, I should first define what it is, then explain how it works, and finally highlight its key benefits. Let me start with a clear definition that captures its essence as a step-by-step problem-solving approach. Then I'll explain the mechanism - how breaking down complex problems into smaller logical steps makes them more manageable and accurate. Finally, I'll emphasize the practical benefits like transparency, accuracy, and trust-building that make this approach so valuable for AI systems and users alike.`,
      timestamp: '2:34 PM',
      modelId: 'kimi-k2-thinking',
      modelName: 'Kimi K2 Thinking',
      reasoningType: 'analysis' as const,
      confidence: 94,
      processingTime: 1.2
    }
  ]

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <OkaraHeader
        selectedModel={selectedModel}
        onModelSelect={setSelectedModel}
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <OkaraSidebarV2
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          history={[]}
          onNewChat={() => {}}
          onClearAll={() => {}}
          onExport={() => {}}
        />

        {/* Main Content */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <div className="max-w-[680px] mx-auto w-full space-y-6">
              {sampleMessages.map((message, index) => (
                <OkaraMessageBubble
                  key={index}
                  {...message}
                />
              ))}
            </div>
          </div>

          {/* Demo Info */}
          <div className="border-t border-gray-200 bg-gray-50 p-4">
            <div className="max-w-[680px] mx-auto text-center">
              <p className="text-sm text-gray-600">
                <strong>Demo:</strong> This showcases the enhanced chain of thought features with exact Okara styling.
                Click the brain icon in the message above to toggle the reasoning panel.
              </p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}