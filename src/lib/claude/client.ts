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

// OAuth 토큰 자동 갱신을 위한 캐시
let cachedAccessToken: string | null = null;
let cachedExpiresAt = 0;

const OAUTH_TOKEN_URL = "https://console.anthropic.com/v1/oauth/token";
const OAUTH_CLIENT_ID = "9d1c250a-e61b-44d9-88ed-5944d1962f5e";

async function refreshOAuthToken(refreshToken: string): Promise<string> {
  const res = await fetch(OAUTH_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: OAUTH_CLIENT_ID,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OAuth 토큰 갱신 실패 (${res.status}): ${text}`);
  }

  const data = await res.json();
  cachedAccessToken = data.access_token;
  // 만료 5분 전에 갱신하도록 여유를 둠
  cachedExpiresAt = Date.now() + (data.expires_in || 3600) * 1000 - 300_000;
  return cachedAccessToken!;
}

export async function getAccessToken(): Promise<{ token: string; isOAuth: boolean }> {
  // 1. API 키 (sk-ant-api) → 만료 없음, 바로 사용
  if (process.env.ANTHROPIC_API_KEY?.startsWith("sk-ant-api")) {
    return { token: process.env.ANTHROPIC_API_KEY, isOAuth: false };
  }

  // 2. OAuth refresh token으로 자동 갱신
  const refreshToken = process.env.OAUTH_REFRESH_TOKEN;
  if (refreshToken) {
    if (cachedAccessToken && Date.now() < cachedExpiresAt) {
      return { token: cachedAccessToken, isOAuth: true };
    }
    const token = await refreshOAuthToken(refreshToken);
    return { token, isOAuth: true };
  }

  // 3. 환경변수의 OAuth access token (갱신 불가, 폴백)
  if (process.env.ANTHROPIC_API_KEY) {
    return { token: process.env.ANTHROPIC_API_KEY, isOAuth: true };
  }

  // 4. 로컬 credentials 파일 (개발용)
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const credPath = join(home, ".claude", ".credentials.json");

  if (existsSync(credPath)) {
    try {
      const creds = JSON.parse(readFileSync(credPath, "utf-8"));
      const oauth = creds.claudeAiOauth;
      if (oauth?.refreshToken) {
        if (cachedAccessToken && Date.now() < cachedExpiresAt) {
          return { token: cachedAccessToken, isOAuth: true };
        }
        const token = await refreshOAuthToken(oauth.refreshToken);
        return { token, isOAuth: true };
      }
      if (oauth?.accessToken) {
        return { token: oauth.accessToken, isOAuth: true };
      }
    } catch {
      // ignore
    }
  }

  throw new Error("API 키를 찾을 수 없습니다. OAUTH_REFRESH_TOKEN 또는 ANTHROPIC_API_KEY를 설정하세요.");
}

export async function getClient(): Promise<Anthropic> {
  const { token, isOAuth } = await getAccessToken();
  if (isOAuth) {
    // Claude Max OAuth 토큰은 베타 헤더와 Claude Code user-agent가 필요
    return new Anthropic({
      authToken: token,
      apiKey: undefined,
      defaultHeaders: {
        "anthropic-beta": "oauth-2025-04-20",
        "anthropic-version": "2023-06-01",
        "User-Agent": "claude-cli/1.0.0 (external, cli)",
      },
    });
  }
  return new Anthropic({ apiKey: token });
}

// SSE 스트리밍 버전: 진행률을 콜백으로 전달
export async function analyzeDestinyStreaming(
  input: AnalysisInput,
  onProgress: (pct: number) => void,
): Promise<AnalysisResponse> {
  const client = await getClient();
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
  const client = await getClient();
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
