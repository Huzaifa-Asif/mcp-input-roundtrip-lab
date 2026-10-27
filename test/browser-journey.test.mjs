import test from 'node:test';
import assert from 'node:assert/strict';

test('browser journey loads an example and renders analysis as text', async () => {
  const nodes = Object.fromEntries(['transcript', 'output', 'status', 'analyze', 'example'].map(id => [id, {
    value: '', textContent: '', handlers: {}, addEventListener(type, handler) { this.handlers[type] = handler; }
  }]));
  globalThis.document = { querySelector: selector => nodes[selector.slice(1)] };
  await import(`../src/app.mjs?journey=${Date.now()}`);
  nodes.example.handlers.click();
  assert.match(nodes.transcript.value, /input_required/);
  nodes.analyze.handlers.click();
  const report = JSON.parse(nodes.output.textContent);
  assert.equal(report.summary.completeFlows, 1);
  assert.match(nodes.status.textContent, /Analysis complete/);

  nodes.transcript.value = '{';
  nodes.analyze.handlers.click();
  assert.match(nodes.output.textContent, /^Error:/);
  assert.equal(nodes.status.textContent, 'Analysis failed. Review the report error.');
  delete globalThis.document;
});
