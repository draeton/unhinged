#!/usr/bin/env node
// PreToolUse hook (Bash): blocks `git commit` / `git push` while the current
// branch is main/master. See CLAUDE.md's "Workflow conventions" section.
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

let payload;
try {
  payload = JSON.parse(readStdin());
} catch {
  process.exit(0);
}

const command = payload?.tool_input?.command;
if (!command || typeof command !== 'string') process.exit(0);

const writesToRepo = /\bgit\s+(commit|push)\b/.test(command);
if (!writesToRepo) process.exit(0);

let branch = '';
try {
  branch = execSync('git branch --show-current', {
    cwd: payload.cwd || process.cwd(),
    encoding: 'utf8',
  }).trim();
} catch {
  process.exit(0);
}

if (branch === 'main' || branch === 'master') {
  console.error(
    `Blocked: refusing to run \`${command.trim()}\` while on '${branch}'. ` +
    'Create a feature branch first (e.g. `git checkout -b feat/my-change`).'
  );
  process.exit(2);
}

process.exit(0);
