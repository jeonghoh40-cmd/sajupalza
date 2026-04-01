import Anthropic from "@anthropic-ai/sdk";
import { existsSync, readFileSync } from "fs";
import { join } from "path";
import { SYSTEM_PROMPT } from "./prompts/system";
import { buildUserPrompt } from "./prompts/user";
import { parseResponse } from "./parser";
import type { AnalysisInput, AnalysisResponse } from "@/lib/types";

const MODELS = [
  "claude-haiku-4-5-20251001",
  "claude-sonnet-4-6",
] as const;

function getApiKey(): string {
  if (process.env.ANTHROPIC_API_KEY) {
    return process.env.ANTHROPIC_API_KEY;
  }

  const home = process.env.USERPROFILE || process.env.HOME || "";
  const credPath = join(home, ".claude", ".credentials.json");

  if (existsSync(credPath)) {
    try {
      const creds = JSON.parse(readFileSync(credPath, "utf-8"));
      if (creds.claudeAiOauth?.accessToken) {
        return creds.claudeAiOauth.accessToken;
      }
    } catch {
      // 파싱 실패 시 무시
    }
  }

  throw new Error("API 키를 찾을 수 없습니다. ANTHROPIC_API_KEY 환경변수를 설정하거나 Claude CLI에 로그인해주세요.");
}

async function callApi(client: Anthropic, model: string, userPrompt: string): Promise<string> {
  const stream = client.messages.stream({
    model,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });

  let text = "";
  for await (const event of stream) {
    if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
      text += event.delta.text;
    }
  }
  return text;
}

async function callWithFallback(client: Anthropic, userPrompt: string): Promise<string> {
  for (const model of MODELS) {
    try {
      console.log(`[claude] trying model: ${model}`);
      return await callApi(client, model, userPrompt);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) {
        console.log(`[claude] ${model} rate limited, trying next model...`);
        continue;
      }
      throw err;
    }
  }

  // 모든 모델 실패 시 마지막 모델로 대기 후 재시도
  console.log("[claude] all models rate limited, waiting 30s...");
  await new Promise((r) => setTimeout(r, 30_000));
  return callApi(client, MODELS[MODELS.length - 1], userPrompt);
}

export async function analyzeDestiny(
  input: AnalysisInput
): Promise<AnalysisResponse> {
  const apiKey = getApiKey();
  const client = new Anthropic({ apiKey });

  const userPrompt = buildUserPrompt(input);
  console.log("[claude] calling API, prompt length:", userPrompt.length);

  const text = await callWithFallback(client, userPrompt);

  console.log("[claude] response length:", text.length);
  return parseResponse(text);
}
