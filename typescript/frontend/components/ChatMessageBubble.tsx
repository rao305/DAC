// frontend/components/ChatMessageBubble.tsx
'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import clsx from 'clsx';

type ChatMessageBubbleProps = {
    role: 'user' | 'assistant';
    children: ReactNode;
    isStreaming?: boolean;
};

export function ChatMessageBubble({ role, children, isStreaming }: ChatMessageBubbleProps) {
    const isUser = role === 'user';
    return (
        <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx('flex w-full mb-3', {
                'justify-end': isUser,
                'justify-start': !isUser,
            })}
        >
            <div
                className={clsx(
                    'max-w-[80%] rounded-2xl px-4 py-3 shadow-lg text-sm leading-relaxed',
                    'border border-slate-700/70 backdrop-blur',
                    isUser
                        ? 'bg-emerald-500/10 text-emerald-50'
                        : 'bg-slate-900/80 text-slate-100',
                )}
            >
                {children}
                {isStreaming && (
                    <span className="inline-block w-2 h-3 ml-1 align-bottom">
                        <span className="inline-block w-1 h-3 bg-slate-300 animate-pulse rounded-sm" />
                    </span>
                )}
            </div>
        </motion.div>
    );
}
