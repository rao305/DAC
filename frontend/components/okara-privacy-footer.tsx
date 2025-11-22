'use client'

import * as React from 'react'
import { Shield, Check, Trash2 } from 'lucide-react'

export function OkaraPrivacyFooter() {
    const features = [
        {
            icon: Shield,
            title: 'Data Encryption',
            subtitle: 'Your chats are fully encrypted',
        },
        {
            icon: Check,
            title: 'No data for training',
            subtitle: 'We never use your conversations',
        },
        {
            icon: Trash2,
            title: 'Permanent deletion',
            subtitle: 'When you delete chats, they are erased forever',
        },
    ]

    return (
        <div className="grid w-full max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
            {features.map((feature, index) => {
                const Icon = feature.icon
                return (
                    <div key={index} className="flex flex-col items-center text-center">
                        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-900 border border-white/10">
                            <Icon className="h-5 w-5 text-zinc-400" />
                        </div>
                        <h3 className="mb-1 text-sm font-semibold text-zinc-100">{feature.title}</h3>
                        <p className="text-xs text-zinc-500">{feature.subtitle}</p>
                    </div>
                )
            })}
        </div>
    )
}
