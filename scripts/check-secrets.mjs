#!/usr/bin/env node
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { classifyValue } from './lib/secret-patterns.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PLUGIN_ROOT = path.resolve(__dirname, '..');

export function findIssues(source) {
  const issues = [];
  const walk = (node, pathParts) => {
    if (typeof node === 'string') {
      const r = classifyValue(node);
      if (r.level === 'error' || r.level === 'warn') {
        issues.push({ path: pathParts.join('.'), level: r.level, reason: r.reason, value: node });
      }
    } else if (Array.isArray(node)) {
      node.forEach((v, i) => walk(v, [...pathParts, String(i)]));
    } else if (node && typeof node === 'object') {
      for (const [k, v] of Object.entries(node)) walk(v, [...pathParts, k]);
    }
  };
  walk(source, []);
  return issues;
}

function main() {
  const target = process.argv[2] ?? path.join(PLUGIN_ROOT, 'mcp.servers.json');
  let source;
  try {
    source = JSON.parse(readFileSync(target, 'utf8'));
  } catch (err) {
    console.error(`check-secrets: cannot read ${target}: ${err.message}`);
    process.exit(2);
  }
  const issues = findIssues(source);
  let errors = 0;
  let warns = 0;
  for (const issue of issues) {
    const tag = issue.level === 'error' ? 'ERROR' : 'WARN';
    console.error(`${tag}: ${issue.path}: ${issue.reason}`);
    if (issue.level === 'error') errors++;
    else warns++;
  }
  if (errors > 0) {
    console.error(`check-secrets: ${errors} error(s) found — refusing to continue.`);
    process.exit(1);
  }
  if (warns > 0) {
    console.error(`check-secrets: ${warns} warning(s) — review manually.`);
  } else {
    console.log('check-secrets: ok');
  }
}

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) main();
