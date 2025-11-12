"use client"

import * as React from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { PlayCircle, Loader2 } from "lucide-react"
import Counter from "@/components/motion/Counter"

interface APIPlaygroundProps {
  trigger?: React.ReactNode
}

export function APIPlayground({ trigger }: APIPlaygroundProps) {
  const [prompt, setPrompt] = React.useState("Write a haiku about artificial intelligence")
  const [model, setModel] = React.useState("gpt-4")
  const [temperature, setTemperature] = React.useState([0.7])
  const [response, setResponse] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [tokens, setTokens] = React.useState(0)
  const [latency, setLatency] = React.useState(0)

  const handleSubmit = async () => {
    setIsLoading(true)
    setResponse("")
    setTokens(0)
    setLatency(0)

    const startTime = Date.now()

    try {
      // Simulate API call - in production, this would call your backend
      await new Promise((resolve) => setTimeout(resolve, 1500))
      
      const mockResponse =
        "Silicon minds awaken,\nThoughts flowing through circuits deep,\nFuture whispers here."
      
      setResponse(mockResponse)
      setTokens(42)
      setLatency(Date.now() - startTime)
    } catch (error) {
      setResponse("Error: Failed to connect to API")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            Try Playground
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>API Playground</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Controls */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="model">Model</Label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger id="model">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gpt-4">GPT-4</SelectItem>
                  <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                  <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                  <SelectItem value="gemini-pro">Gemini Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="temperature">
                Temperature: {temperature[0].toFixed(1)}
              </Label>
              <Slider
                id="temperature"
                min={0}
                max={2}
                step={0.1}
                value={temperature}
                onValueChange={setTemperature}
                className="mt-2"
              />
            </div>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <Label htmlFor="prompt">Prompt</Label>
            <Textarea
              id="prompt"
              placeholder="Enter your prompt..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={4}
              className="resize-none"
            />
          </div>

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={isLoading || !prompt}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 w-4 h-4" />
                Run Request
              </>
            )}
          </Button>

          {/* Response */}
          {(response || isLoading) && (
            <div className="space-y-2">
              <Label>Response</Label>
              <div className="rounded-lg bg-zinc-950 p-4 border border-border min-h-[120px]">
                {isLoading ? (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Streaming response...</span>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-100 whitespace-pre-wrap">{response}</p>
                )}
              </div>
            </div>
          )}

          {/* Metrics */}
          {tokens > 0 && (
            <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900/40 border border-border">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  <Counter to={tokens} suffix="" />
                </div>
                <div className="text-xs text-muted-foreground">Tokens</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-400">
                  <Counter to={latency} suffix="ms" />
                </div>
                <div className="text-xs text-muted-foreground">Latency</div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

