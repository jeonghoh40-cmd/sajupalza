#!/usr/bin/env node
/**
 * 타로 78장을 metabismuth/tarot-json (GitHub) 에서 다운로드.
 * 이미지는 Pamela Colman Smith의 1909년 Rider-Waite-Smith 덱 (public domain).
 *
 * 저장 위치: public/tarot/{cardId}.jpg
 *   id 0~21  = 메이저 (Fool ~ World)
 *   id 22~35 = Wands 1~14
 *   id 36~49 = Cups 1~14
 *   id 50~63 = Swords 1~14
 *   id 64~77 = Pentacles 1~14
 */

import { mkdirSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = join(__dirname, "..", "public", "tarot");
mkdirSync(outDir, { recursive: true });

const BASE = "https://raw.githubusercontent.com/metabismuth/tarot-json/master/cards";

// 우리 deck.ts의 id 순서 → 원본 파일명
const tasks = [];

// Major: id 0~21 → m00 ~ m21
for (let i = 0; i < 22; i++) {
  tasks.push({ id: i, file: `m${String(i).padStart(2, "0")}.jpg` });
}

// Minor 순서는 deck.ts에서 wands → cups → swords → pentacles
const SUIT_PREFIXES = ["w", "c", "s", "p"];
let id = 22;
for (const prefix of SUIT_PREFIXES) {
  for (let n = 1; n <= 14; n++) {
    tasks.push({ id: id++, file: `${prefix}${String(n).padStart(2, "0")}.jpg` });
  }
}

console.log(`다운로드 시작: ${tasks.length}장\n`);

let success = 0;
let failed = 0;
const errors = [];

const concurrency = 8;
for (let i = 0; i < tasks.length; i += concurrency) {
  const batch = tasks.slice(i, i + concurrency);
  await Promise.all(
    batch.map(async ({ id, file }) => {
      const out = join(outDir, `${id}.jpg`);
      if (existsSync(out)) {
        success++;
        process.stdout.write("-");
        return;
      }
      try {
        const res = await fetch(`${BASE}/${file}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const buf = Buffer.from(await res.arrayBuffer());
        writeFileSync(out, buf);
        success++;
        process.stdout.write(".");
      } catch (e) {
        failed++;
        errors.push(`${id} ${file}: ${e.message}`);
        process.stdout.write("x");
      }
    })
  );
}

console.log(`\n\n✅ 성공: ${success} / ❌ 실패: ${failed}`);
if (errors.length) {
  console.log("\n실패 목록:");
  errors.forEach((e) => console.log("  " + e));
}
