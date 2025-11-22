'use client';

import { useState } from 'react';
import { ModelSwitchIndicator } from '@/components/ModelSwitchIndicator';
import { ChatMessageBubble } from '@/components/ChatMessageBubble';
import { ChatInputBox } from '@/components/chat/ChatInputBox';
import { ModelId, getModelById } from '@/components/chat/modelOptions';

export default function ChatPage() {
    const [messages, setMessages] = useState<
        { id: string; role: 'user' | 'assistant'; content: string; streaming?: boolean }[]
    >([]);

    const [activeModelId, setActiveModelId] = useState<ModelId>('kimi-k2-thinking');
    const [phase, setPhase] = useState<'planning' | 'primary' | 'collab' | 'synthesis'>('planning');
    const [inputValue, setInputValue] = useState('');
    const [isSending, setIsSending] = useState(false);

    const activeModel = getModelById(activeModelId);

    // You wire this up to your SSE/WebSocket streaming backend
    // and update messages, activeModel, phase based on router metadata.

    const handleSendMessage = async (content: string) => {
        if (!content.trim()) return;

        // Add user message
        const userMsgId = Date.now().toString();
        setMessages(prev => [...prev, { id: userMsgId, role: 'user', content }]);
        setIsSending(true);

        // Simulate assistant response (replace with actual backend call)
        setTimeout(() => {
            const assistantMsgId = (Date.now() + 1).toString();
            setMessages(prev => [...prev, {
                id: assistantMsgId,
                role: 'assistant',
                content: "I'm a simulated response. Connect me to the backend!"
            }]);
            setIsSending(false);
        }, 1000);
    };

    return (
        <div className="min-h-screen bg-[#212121] text-slate-50 flex flex-col">
            <header className="flex items-center justify-between px-6 py-4 border-b border-[#333]">
                <h1 className="text-sm font-semibold tracking-wide text-slate-200">
                    DAC <span className="text-slate-500">· Multi-LLM Console</span>
                </h1>
                <ModelSwitchIndicator
                    activeModel={activeModelId}
                    activeProvider={activeModel.provider}
                    phase={phase}
                />
            </header>

            <main className="flex-1 flex flex-col relative">
                <div className="flex-1 overflow-y-auto p-4 pb-32">
                    <div className="max-w-3xl mx-auto w-full space-y-4">
                        {messages.map(m => (
                            <ChatMessageBubble key={m.id} role={m.role} isStreaming={m.streaming}>
                                {m.content}
                            </ChatMessageBubble>
                        ))}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-[#212121] via-[#212121] to-transparent">
                    <ChatInputBox
                        value={inputValue}
                        onChange={setInputValue}
                        onSubmit={handleSendMessage}
                        currentModelId={activeModelId}
                        onModelChange={setActiveModelId}
                        isSending={isSending}
                    />
                </div>
            </main>
        </div>
    );
}
