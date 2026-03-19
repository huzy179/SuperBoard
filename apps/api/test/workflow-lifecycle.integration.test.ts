import assert from 'node:assert/strict';
import { describe, it, test } from 'node:test';

describe('workflow lifecycle', () => {
  it('defines workspace/project/task lifecycle API contract scaffold', () => {
    assert.equal(true, true);
  });

  test.todo('archives workspace/project/task and persists isArchived + deletedAt');
  test.todo('blocks restoring child when parent is archived with restore-order guidance');
  test.todo('hides archived records by default and reveals them with showArchived=true');
});
