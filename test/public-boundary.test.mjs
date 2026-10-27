import test from 'node:test';
import assert from 'node:assert/strict';
import { isEditorialPath } from '../scripts/public-boundary-policy.mjs';

test('editorial boundary rejects prior and nested leak patterns', () => {
  for (const path of ['launch-article.md', 'docs/launch-article.md', 'social-draft.txt', 'cover.png', 'assets/cover-draft.webp', 'editorial/article.md', 'docs/editorial/notes.md']) {
    assert.equal(isEditorialPath(path), true, path);
  }
});

test('editorial boundary permits public project assets', () => {
  for (const path of ['README.md', 'styles.css', 'docs/RESEARCH.md', 'assets/app-screenshot.png']) {
    assert.equal(isEditorialPath(path), false, path);
  }
});
