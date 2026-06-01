#!/usr/bin/env node
// design HTML 라이브 프리뷰 런처 (얇은 래퍼)
//
// 책임: 인자/경로를 검증해 five-server 옵션으로 변환하고 five-server를 기동한다.
//   파일 watch·자동 새로고침·브라우저 오픈·OS 분기는 전부 five-server에 위임한다 —
//   이 스크립트는 그 로직을 구현하지 않는다. (overview.html은 형제 assets/ 상대경로라
//   서빙 루트만 맞으면 그대로 동작.)
//
// 사용: node scripts/serve-design.mjs <dir|html경로> [--port N] [--no-open]
//       node scripts/serve-design.mjs <...> --print-options   # 옵션만 출력, 서버 미기동(테스트용)
//
// 여러 design 스킬(design-brand-kit·design-html-prototype 등)이 공유한다.

import { statSync } from "node:fs";
import { resolve, dirname, basename } from "node:path";

const DEFAULT_PORT = 5500;

class ServeDesignError extends Error {
  constructor(message) {
    super(message);
    this.name = "ServeDesignError";
  }
}

function parseArgs(argv) {
  const out = { target: undefined, port: DEFAULT_PORT, open: true, printOptions: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--no-open") {
      out.open = false;
    } else if (a === "--print-options") {
      out.printOptions = true;
    } else if (a === "--port") {
      const v = argv[i + 1];
      if (v === undefined || v.startsWith("--")) throw new ServeDesignError("--port 에 값이 없습니다.");
      i++;
      const n = Number(v);
      if (!Number.isInteger(n) || n <= 0 || n > 65535) throw new ServeDesignError(`--port 값이 올바르지 않습니다: ${v}`);
      out.port = n;
    } else if (a.startsWith("--")) {
      throw new ServeDesignError(`알 수 없는 인자: ${a}`);
    } else if (out.target === undefined) {
      out.target = a;
    } else {
      throw new ServeDesignError(`인자가 너무 많습니다: ${a}`);
    }
  }
  if (out.target === undefined) {
    throw new ServeDesignError("사용: serve-design.mjs <dir|html경로> [--port N] [--no-open]");
  }
  return out;
}

// target 경로 → five-server {root, open}. dir이면 root=dir; 파일이면 root=부모·open=파일명.
function resolveTarget(target, openFlag) {
  const abs = resolve(target);
  let stat;
  try {
    stat = statSync(abs);
  } catch {
    throw new ServeDesignError(`경로를 찾을 수 없습니다: ${abs}`);
  }
  if (stat.isDirectory()) {
    return { root: abs, open: openFlag };
  }
  return { root: dirname(abs), open: openFlag ? basename(abs) : false };
}

// argv → five-server start() 옵션 {root, port, open} (+ printOptions 플래그)
function buildOptions(argv) {
  const args = parseArgs(argv);
  const { root, open } = resolveTarget(args.target, args.open);
  return { root, port: args.port, open, printOptions: args.printOptions };
}

async function main() {
  const { printOptions, ...opts } = buildOptions(process.argv.slice(2));
  if (printOptions) {
    console.log(JSON.stringify(opts));
    return;
  }
  let FiveServer;
  try {
    ({ default: FiveServer } = await import("five-server"));
  } catch (err) {
    throw new ServeDesignError(`five-server를 불러오지 못했습니다 — 'npm install' 했는지 확인하세요. (${err.message})`);
  }
  const server = new FiveServer();
  await server.start(opts);
  console.log(`design 라이브 프리뷰: http://localhost:${opts.port}/ (root: ${opts.root})`);
  console.log("파일이 바뀌면 브라우저가 자동 새로고침됩니다. 종료: Ctrl+C");
}

// ServeDesignError 는 사용자 입력 오류 → 깔끔한 stderr + 종료코드 2 (build-contact-sheet·image-gen 규약과 일치).
main().catch((err) => {
  if (err instanceof ServeDesignError) {
    console.error(err.message);
    process.exit(2);
  }
  throw err;
});
