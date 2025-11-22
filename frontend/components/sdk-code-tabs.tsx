"use client"

import * as React from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Check, Copy } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"

const codeExamples = {
  typescript: `import { Syntra } from '@multa/sdk'

const client = new Syntra({
  apiKey: process.env.MULTA_API_KEY
})

const response = await client.chat.completions.create({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  stream: true
})

for await (const chunk of response) {
  process.stdout.write(chunk.content)
}`,
  python: `from multa import Syntra

client = Syntra(
    api_key=os.environ.get("MULTA_API_KEY")
)

response = client.chat.completions.create(
    messages=[
        {"role": "user", "content": "Hello!"}
    ],
    stream=True
)

for chunk in response:
    print(chunk.content, end="")`,
  curl: `curl https://api.multa.io/v1/chat/completions \\
  -H "Authorization: Bearer $MULTA_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "messages": [
      {
        "role": "user",
        "content": "Hello!"
      }
    ],
    "stream": true
  }'`,
}

export function SDKCodeTabs() {
  const [activeTab, setActiveTab] = React.useState("typescript")
  const [copied, setCopied] = React.useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(codeExamples[activeTab as keyof typeof codeExamples])
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between mb-4">
          <TabsList className="bg-zinc-900/40">
            <TabsTrigger value="typescript">TypeScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCopy}
            className="flex items-center gap-2"
          >
            <AnimatePresence mode="wait">
              {copied ? (
                <motion.div
                  key="check"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2 text-emerald-400"
                >
                  <Check className="w-4 h-4" />
                  <span className="text-sm">Copied!</span>
                </motion.div>
              ) : (
                <motion.div
                  key="copy"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0 }}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  <span className="text-sm">Copy</span>
                </motion.div>
              )}
            </AnimatePresence>
          </Button>
        </div>

        {Object.entries(codeExamples).map(([lang, code]) => (
          <TabsContent key={lang} value={lang} className="mt-0">
            <pre className="rounded-lg bg-zinc-950 p-4 overflow-x-auto border border-border">
              <code className="text-sm text-zinc-100">{code}</code>
            </pre>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

