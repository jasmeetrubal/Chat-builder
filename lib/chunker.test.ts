+import { chunkText } from './chunker.js';
+import { test } from 'node:test';
+import assert from 'node:assert/strict';
+
+test('handles short text without infinite loop', () => {
+  const result = chunkText('hello', 1200, 200);
+  assert.deepEqual(result, ['hello']);
+});
+
+test('respects overlap between chunks', () => {
+  const result = chunkText('abcdef', 4, 2);
+  assert.deepEqual(result, ['abcd', 'cdef']);
+});
