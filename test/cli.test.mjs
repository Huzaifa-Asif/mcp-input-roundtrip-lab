import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('CLI emits a successful bounded report for the safe example', () => {
  const run = spawnSync(process.execPath, ['cli.mjs', 'examples/safe.json'], { encoding: 'utf8' });
  assert.equal(run.status, 0, run.stderr);
  const report = JSON.parse(run.stdout);
  assert.equal(report.summary.completeFlows, 1);
  assert.equal(report.summary.errorFindings, 0);
});

test('CLI distinguishes analyzer findings from malformed input', () => {
  const fixtureDir = mkdtempSync(join(tmpdir(), 'mcp-roundtrip-cli-'));
  const invalidPath = join(fixtureDir, 'invalid-flow.json');
  const malformedPath = join(fixtureDir, 'malformed.json');
  writeFileSync(invalidPath, '[{"direction":"server_to_client","message":{"id":9,"result":{}}}]');
  writeFileSync(malformedPath, '{');
  const invalidFlow = spawnSync(process.execPath, ['cli.mjs', invalidPath], { encoding: 'utf8' });
  assert.equal(invalidFlow.status, 1);
  assert.equal(JSON.parse(invalidFlow.stdout).summary.errorFindings, 1);

  const malformed = spawnSync(process.execPath, ['cli.mjs', malformedPath], { encoding: 'utf8' });
  assert.equal(malformed.status, 2);
  assert.match(malformed.stderr, /valid JSON/);
  rmSync(fixtureDir, { recursive: true });
});
