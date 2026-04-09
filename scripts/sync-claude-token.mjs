#!/usr/bin/env node
/**
 * Claude Max OAuth access token을 Vercel에 동기화
 *
 * 사용:
 *   npm run sync-token
 *
 * 동작:
 *   1. ~/.claude/.credentials.json에서 최신 access_token 읽음
 *   2. Vercel의 CLAUDE_OAUTH_TOKEN 환경변수를 갱신
 *   3. 재배포 트리거
 *
 * 토큰은 약 8시간 유효. 만료 시 다시 실행하면 됨.
 */

import { readFileSync, writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { execSync } from "child_process";

const credPath = join(homedir(), ".claude", ".credentials.json");

let creds;
try {
  creds = JSON.parse(readFileSync(credPath, "utf-8"));
} catch (e) {
  console.error("❌ ~/.claude/.credentials.json을 읽을 수 없습니다.");
  console.error("   Claude Code 로그인이 필요합니다.");
  process.exit(1);
}

const oauth = creds.claudeAiOauth;
if (!oauth?.accessToken) {
  console.error("❌ accessToken이 없습니다. Claude Code에 로그인하세요.");
  process.exit(1);
}

const hoursLeft = ((oauth.expiresAt - Date.now()) / 3600000).toFixed(1);
console.log(`📥 로컬 access token 읽기 완료 (만료까지 ${hoursLeft}시간)`);

const tmpFile = ".claude_oauth_token.tmp";
writeFileSync(tmpFile, oauth.accessToken);

try {
  console.log("🗑️  Vercel에서 기존 CLAUDE_OAUTH_TOKEN 제거 중...");
  try {
    execSync("npx vercel env rm CLAUDE_OAUTH_TOKEN production -y", { stdio: "pipe" });
  } catch {
    // 없으면 무시
  }

  console.log("⬆️  Vercel에 새 CLAUDE_OAUTH_TOKEN 등록 중...");
  execSync(`type "${tmpFile}" | npx vercel env add CLAUDE_OAUTH_TOKEN production`, {
    stdio: "inherit",
    shell: "cmd.exe",
  });

  console.log("🚀 Production 재배포 중...");
  execSync("npx vercel --prod", { stdio: "inherit" });

  console.log(`\n✅ 동기화 완료. 약 ${hoursLeft}시간 후 만료되니 그때 다시 실행하세요.`);
} finally {
  try {
    unlinkSync(tmpFile);
  } catch {
    // ignore
  }
}
