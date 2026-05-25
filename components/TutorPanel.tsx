'use client'

import { useRef, useEffect, useState } from 'react'
import {
  Message,
  MessageContent,
  MessageResponse,
} from '@/components/ai-elements/message'
import { SpeechInput } from '@/components/ai-elements/speech-input'
import type { UIMessage } from 'ai'

interface TutorPanelProps {
  messages: UIMessage[]
  status: string
  onMissing: () => void
  onDialogue: (question: string) => void
  isSpeaking: boolean
  onStopSpeaking: () => void
}

function extractText(msg: UIMessage): string {
  return msg.parts
    .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map(p => p.text)
    .join('')
}

// Returns a compact label for move submission messages, or null for dialogue messages
function moveLabel(msg: UIMessage): string | null {
  const text = extractText(msg)
  const playerMatch = text.match(/^I just played ([^\n.]+)/)
  if (playerMatch) return `My move: ${playerMatch[1].trim()}`
  const opponentMatch = text.match(/^My opponent just played ([^\n.]+)/)
  if (opponentMatch) return `Opponent: ${opponentMatch[1].trim()}`
  if (text.startsWith('What might I be missing')) return 'What am I missing?'
  return null
}

export default function TutorPanel({
  messages,
  status,
  onMissing,
  onDialogue,
  isSpeaking,
  onStopSpeaking,
}: TutorPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [dialogueInput, setDialogueInput] = useState('')
  const isStreaming = status === 'streaming' || status === 'submitted'

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, status])

  function handleDialogueSubmit() {
    const q = dialogueInput.trim()
    if (!q || isStreaming) return
    onDialogue(q)
    setDialogueInput('')
  }

  function handleDialogueKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleDialogueSubmit()
    }
  }

  function handleSpeechTranscript(transcript: string) {
    setDialogueInput(transcript)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
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

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-5 min-h-0">
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground italic">
            Enter a move to begin — I&apos;ll help you think through the position.
          </p>
        )}
        {messages.map(msg => {
          if (msg.role === 'assistant') {
            return (
              <div key={msg.id}>
                <Message from="assistant">
                  <MessageContent>
                    <MessageResponse isAnimating={isStreaming}>
                      {extractText(msg)}
                    </MessageResponse>
                  </MessageContent>
                </Message>
              </div>
            )
          }

          if (msg.role === 'user') {
            const label = moveLabel(msg)
            if (label) {
              // Compact move pill
              return (
                <div key={msg.id} className="flex justify-start">
                  <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                    {label}
                  </span>
                </div>
              )
            }
            // Dialogue question — show as a chat bubble
            return (
              <div key={msg.id} className="flex justify-end">
                <span className="max-w-[80%] text-sm px-3 py-2 rounded-2xl rounded-br-sm bg-primary/15 text-foreground">
                  {extractText(msg)}
                </span>
              </div>
            )
          }

          return null
        })}
        {isStreaming && messages.at(-1)?.role !== 'assistant' && (
          <p className="text-sm text-muted-foreground animate-pulse">Thinking…</p>
        )}
      </div>

      {/* Dialogue input */}
      <div className="shrink-0 border-t border-border p-3">
        <div className="flex gap-2 items-center">
          <input
            type="text"
            value={dialogueInput}
            onChange={e => setDialogueInput(e.target.value)}
            onKeyDown={handleDialogueKey}
            placeholder="Ask a question about the position…"
            disabled={isStreaming}
            className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-40"
          />
          <SpeechInput
            onTranscriptionChange={handleSpeechTranscript}
            className="shrink-0"
          />
          <button
            onClick={handleDialogueSubmit}
            disabled={isStreaming || !dialogueInput.trim()}
            className="px-3 py-2 text-sm rounded-md bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Ask
          </button>
        </div>
      </div>
    </div>
  )
}
