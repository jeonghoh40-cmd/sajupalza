import Anthropic from "@anthropic-ai/sdk";
import { SYSTEM_PROMPT } from "./prompts/system";
import { buildUserPrompt } from "./prompts/user";
import { parseResponse } from "./parser";
import type { AnalysisInput, AnalysisResponse } from "@/lib/types";

const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
] as const;

function getClient(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY 환경변수가 설정되지 않았습니다.");
  }
  return new Anthropic({ apiKey });
}

// SSE 스트리밍 버전: 진행률을 콜백으로 전달
export async function analyzeDestinyStreaming(
  input: AnalysisInput,
  onProgress: (pct: number) => void,
): Promise<AnalysisResponse> {
  const client = getClient();
  const userPrompt = buildUserPrompt(input);

  for (const model of MODELS) {
    try {
      const stream = client.messages.stream({
        model,
        max_tokens: 16000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      let text = "";
      const estimatedTokens = 6000;
      let tokenCount = 0;

      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          text += event.delta.text;
          tokenCount++;
          onProgress(Math.min(95, Math.round((tokenCount / estimatedTokens) * 100)));
        }
      }

      onProgress(98);
      const result = parseResponse(text);
      onProgress(100);
      return result;
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) continue;
      throw err;
    }
  }

  throw new Error("모든 모델이 사용 불가합니다. 잠시 후 다시 시도해주세요.");
}

// 비스트리밍 (폴백용)
export async function analyzeDestiny(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  const client = getClient();
  const userPrompt = buildUserPrompt(input);

  for (const model of MODELS) {
    try {
      const stream = client.messages.stream({
        model,
        max_tokens: 16000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      let text = "";
      for await (const event of stream) {
        if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
          text += event.delta.text;
        }
      }
      return parseResponse(text);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) continue;
      throw err;
    }
  }

  throw new Error("모든 모델이 사용 불가합니다. 잠시 후 다시 시도해주세요.");
}
