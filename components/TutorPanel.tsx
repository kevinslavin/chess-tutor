'use client'

import { useRef, useEffect } from 'react'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import type { UIMessage } from 'ai'

interface TutorPanelProps {
  messages: UIMessage[]
  status: string
  onMissing: () => void
  isSpeaking: boolean
  onStopSpeaking: () => void
}

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')
}

function userLabel(msg: UIMessage): string {
  const text = extractText(msg)
  const firstLine = text.split('\n')[0] ?? ''
  return firstLine.length > 80 ? firstLine.slice(0, 80) + '…' : firstLine
}

export default function TutorPanel({
  messages,
  status,
  onMissing,
  isSpeaking,
  onStopSpeaking,
}: TutorPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  return (
    <div className="flex flex-col h-full">
      <div className="flex gap-2 p-3 border-b border-border shrink-0">
        <button
          onClick={onMissing}
          disabled={isStreaming}
          className="px-3 py-1.5 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          What am I missing?
        </button>
        {isSpeaking && (
          <button
            onClick={onStopSpeaking}
            className="px-3 py-1.5 text-sm rounded-md bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            ■ Stop speaking
          </button>
        )}
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Enter a move to begin — I&apos;ll help you think through the position.
          </p>
        )}
        {messages.map(msg => (
          <div key={msg.id}>
            {msg.role === 'assistant' && (
              <Message from="assistant">
                <MessageContent>
                  <MessageResponse isAnimating={isStreaming}>
                    {extractText(msg)}
                  </MessageResponse>
                </MessageContent>
              </Message>
            )}
            {msg.role === 'user' && (
              <p className="text-xs text-muted-foreground font-mono opacity-60">
                {userLabel(msg)}
              </p>
            )}
          </div>
        ))}
        {isStreaming && messages.at(-1)?.role !== 'assistant' && (
          <p className="text-sm text-muted-foreground animate-pulse">Thinking…</p>
        )}
      </div>
    </div>
  )
}
