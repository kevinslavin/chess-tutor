import { streamText, convertToModelMessages } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import type { UIMessage } from 'ai'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const modelMessages = await convertToModelMessages(messages)

  const result = streamText({
    model: anthropic('claude-sonnet-4-20250514'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 900,
  })

  return result.toUIMessageStreamResponse()
}
