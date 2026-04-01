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

interface AuthConfig {
  apiKey?: string;
  authToken?: string;
}

function getAuthConfig(): AuthConfig {
  // 1. 명시적 API 키 (sk-ant-로 시작하는 Anthropic API 키)
  if (process.env.ANTHROPIC_API_KEY) {
    const key = process.env.ANTHROPIC_API_KEY;
    if (key.startsWith("sk-ant-")) {
      return { apiKey: key };
    }
    // API 키 형식이 아니면 OAuth 토큰으로 취급
    return { authToken: key };
  }

  // 2. Claude Max OAuth 토큰 (로컬 개발용)
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const credPath = join(home, ".claude", ".credentials.json");

  if (existsSync(credPath)) {
    try {
      const creds = JSON.parse(readFileSync(credPath, "utf-8"));
      if (creds.claudeAiOauth?.accessToken) {
        return { authToken: creds.claudeAiOauth.accessToken };
      }
    } catch {
      // ignore
    }
  }

  throw new Error("API 키를 찾을 수 없습니다.");
}

function getClient(): Anthropic {
  const auth = getAuthConfig();
  if (auth.authToken) {
    return new Anthropic({ authToken: auth.authToken, apiKey: undefined });
  }
  return new Anthropic({ apiKey: auth.apiKey });
}

async function callApi(client: Anthropic, model: string, userPrompt: string): Promise<string> {
  const stream = client.messages.stream({
    model,
    max_tokens: 12000,
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
  return text;
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
        max_tokens: 12000,
        temperature: 0,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userPrompt }],
      });

      let text = "";
      const estimatedTokens = 3500; // 예상 출력 토큰
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
      const text = await callApi(client, model, userPrompt);
      return parseResponse(text);
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 429) continue;
      throw err;
    }
  }

  throw new Error("모든 모델이 사용 불가합니다. 잠시 후 다시 시도해주세요.");
}
