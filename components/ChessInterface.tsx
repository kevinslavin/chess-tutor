'use client'

import { useState, useEffect, useCallback } from 'react'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { Chess } from 'chess.js'
import { Chessboard } from 'react-chessboard'
import { SpeechInput } from '@/components/ai-elements/speech-input'
import TutorPanel from './TutorPanel'
import {
  buildPlayerMoveMessage,
  buildOpponentMoveMessage,
  buildMissingMessage,
} from '@/lib/buildUserMessage'
import { parseMove } from '@/lib/parseMove'

export default function ChessInterface() {
  const [chess] = useState(() => new Chess())
  const [fen, setFen] = useState(chess.fen())
  const [moveInput, setMoveInput] = useState('')
  const [moveType, setMoveType] = useState<'player' | 'opponent'>('player')
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [moveError, setMoveError] = useState('')

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: '/api/tutor' }),
  })

  const speakResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const clean = text.replace(/[*_#`~]/g, '').replace(/\n+/g, '. ')
    const utterance = new SpeechSynthesisUtterance(clean)
    utterance.rate = 0.92
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    setIsSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }, [])

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [])

  // Auto-speak completed assistant responses
  useEffect(() => {
    if (status !== 'ready') return
    const lastMsg = messages.at(-1)
    if (!lastMsg || lastMsg.role !== 'assistant') return
    const text = lastMsg.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map(p => p.text)
      .join(' ')
    if (text) speakResponse(text)
  }, [status, messages, speakResponse])

  function handleMoveSubmit() {
    const raw = moveInput.trim()
    if (!raw) return
    setMoveError('')

    const result = parseMove(raw, chess)

    if (!result) {
      setMoveError(`Couldn't understand "${raw}" as a move in this position. Try "bishop to e4", "knight takes d5", or standard notation like "Nf3".`)
      return
    }

    const newFen = chess.fen()
    setFen(newFen)
    const history = chess.history()

    const text =
      moveType === 'player'
        ? buildPlayerMoveMessage(result.san, newFen, history)
        : buildOpponentMoveMessage(result.san, newFen, history)

    sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
    setMoveInput('')
    setMoveType(moveType === 'player' ? 'opponent' : 'player')
  }

  function handleMissingClick() {
    const text = buildMissingMessage(chess.fen(), chess.history())
    sendMessage({ role: 'user', parts: [{ type: 'text', text }] })
  }

  function handleDialogue(question: string) {
    sendMessage({ role: 'user', parts: [{ type: 'text', text: question }] })
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleMoveSubmit()
  }

  function handleSpeechTranscript(transcript: string) {
    setMoveInput(transcript)
  }

  function handleNewGame() {
    chess.reset()
    setFen(chess.fen())
    setMoveType('player')
    setMoveInput('')
    setMoveError('')
    stopSpeaking()
  }

  const isStreaming = status === 'streaming' || status === 'submitted'

  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      {/* Left panel: board + controls */}
      <div className="flex flex-col items-center justify-center gap-4 p-6 w-[480px] shrink-0">
        <div className="flex items-center gap-2 w-full">
          <span className="text-lg font-semibold tracking-tight">♟ Chess Tutor</span>
          <button
            onClick={handleNewGame}
            className="ml-auto text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            New game
          </button>
        </div>

        <div className="w-full">
          <Chessboard
            position={fen}
            arePiecesDraggable={false}
            boardWidth={420}
            customDarkSquareStyle={{ backgroundColor: '#b58863' }}
            customLightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          />
        </div>

        {/* Move type toggle */}
        <div className="flex gap-3 w-full">
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio"
              name="moveType"
              value="player"
              checked={moveType === 'player'}
              onChange={() => setMoveType('player')}
              className="accent-primary"
            />
            My move
          </label>
          <label className="flex items-center gap-1.5 cursor-pointer text-sm">
            <input
              type="radio"
              name="moveType"
              value="opponent"
              checked={moveType === 'opponent'}
              onChange={() => setMoveType('opponent')}
              className="accent-primary"
            />
            Opponent&apos;s move
          </label>
        </div>

        {/* Move input row */}
        <div className="flex gap-2 w-full items-center">
          <input
            type="text"
            value={moveInput}
            onChange={e => setMoveInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g. "bishop takes d5", "knight to f3", "e4"'
            className="flex-1 px-3 py-2 text-sm rounded-md border border-input bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
          <SpeechInput
            onTranscriptionChange={handleSpeechTranscript}
            className="shrink-0"
          />
          <button
            onClick={handleMoveSubmit}
            disabled={isStreaming || !moveInput.trim()}
            className="px-4 py-2 text-sm rounded-md bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Submit ▶
          </button>
        </div>

        {moveError && (
          <p className="text-sm text-destructive w-full">{moveError}</p>
        )}
      </div>

      {/* Divider */}
      <div className="w-px bg-border" />

      {/* Right panel: tutor */}
      <div className="flex-1 flex flex-col min-h-0">
        <TutorPanel
          messages={messages}
          status={status}
          onMissing={handleMissingClick}
          onDialogue={handleDialogue}
          isSpeaking={isSpeaking}
          onStopSpeaking={stopSpeaking}
        />
      </div>
    </div>
  )
}
