import Anthropic from '@anthropic-ai/sdk';
import { ExtractionSchema, type Extraction, type ParsedThread } from './types.js';
import { SYSTEM_PROMPT, buildUserPrompt } from './prompt.js';

export const DEFAULT_MODEL = 'claude-haiku-4-5-20251001';

export interface ExtractOptions {
  model?: string;
  apiKey?: string;
  maxTokens?: number;
}

export interface ExtractResult {
  model: string;
  extraction: Extraction;
}

function stripCodeFences(text: string): string {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenced?.[1]) return fenced[1].trim();
  return text.trim();
}

export async function extractFromThread(
  thread: ParsedThread,
  opts: ExtractOptions = {},
): Promise<ExtractResult> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant');
  const model = opts.model ?? DEFAULT_MODEL;
  const client = new Anthropic({ apiKey });

  const message = await client.messages.create({
    model,
    max_tokens: opts.maxTokens ?? 2048,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(thread) }],
  });

  const textBlock = message.content.find((b) => b.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('Réponse Claude sans bloc texte');
  }
  const raw = stripCodeFences(textBlock.text);
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    throw new Error(`JSON invalide en sortie LLM : ${(e as Error).message}\n---\n${raw}`);
  }
  const extraction = ExtractionSchema.parse(parsed);
  return { model, extraction };
}
