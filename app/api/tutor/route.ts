import { streamText, convertToModelMessages } from 'ai'
import { createAnthropic } from '@ai-sdk/anthropic'
import { SYSTEM_PROMPT } from '@/lib/systemPrompt'
import type { UIMessage } from 'ai'

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json()
  const modelMessages = await convertToModelMessages(messages)

  // @ai-sdk/anthropic v3 defaults to the versionless endpoint; pin to /v1
  const anthropic = createAnthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    baseURL: 'https://api.anthropic.com/v1',
  })

  const result = streamText({
    model: anthropic('claude-sonnet-4-6'),
    system: SYSTEM_PROMPT,
    messages: modelMessages,
    maxOutputTokens: 900,
  })

  return result.toUIMessageStreamResponse()
}
