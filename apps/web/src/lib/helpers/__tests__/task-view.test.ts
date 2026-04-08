import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type {
  ProjectTaskItemDTO,
  TaskStatusDTO,
  TaskPriorityDTO,
  TaskTypeDTO,
} from '@superboard/shared';
import {
  filterAndSortProjectTasks,
  buildBoardData,
  buildFractionalTaskPosition,
  toggleSetFilterValue,
  isTaskOverdue,
} from '../task-view';

const makeTask = (
  overrides: Partial<{
    id: string;
    title: string;
    description: string | null;
    status: TaskStatusDTO;
    priority: TaskPriorityDTO;
    type: TaskTypeDTO;
    dueDate: string | null;
    assigneeId: string | null;
    position: string | null;
    createdAt: string;
    updatedAt: string;
    number: number | null;
    labels: ProjectTaskItemDTO['labels'];
  }> = {},
): ProjectTaskItemDTO =>
  ({
    id: 'task-1',
    title: 'Task 1',
    description: null,
    status: 'todo',
    priority: 'medium',
    type: 'task',
    dueDate: null,
    assigneeId: null,
    position: null,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    number: 1,
    labels: [],
    ...overrides,
  }) as ProjectTaskItemDTO;

describe('filterAndSortProjectTasks', () => {
  it('returns all tasks when no filters applied', () => {
    const tasks = [makeTask({ id: 't1' }), makeTask({ id: 't2' })];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 2);
  });

  it('filters by query matching title', () => {
    const tasks = [
      makeTask({ id: 't1', title: 'Login bug' }),
      makeTask({ id: 't2', title: 'Dashboard UI' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: 'login',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.id, 't1');
  });

  it('filters by query matching task number', () => {
    const tasks = [makeTask({ id: 't1', number: 5 }), makeTask({ id: 't2', number: 12 })];
    const result = filterAndSortProjectTasks(tasks, {
      query: '12',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.id, 't2');
  });

  it('filters by assigneeId', () => {
    const tasks = [
      makeTask({ id: 't1', assigneeId: 'user-a' }),
      makeTask({ id: 't2', assigneeId: 'user-b' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: 'user-a',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.id, 't1');
  });

  it('filters by status', () => {
    const tasks = [makeTask({ id: 't1', status: 'todo' }), makeTask({ id: 't2', status: 'done' })];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(['todo']),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 1);
    assert.equal(result[0]!.status, 'todo');
  });

  it('filters by multiple statuses', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo' }),
      makeTask({ id: 't2', status: 'done' }),
      makeTask({ id: 't3', status: 'in_progress' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(['todo', 'done']),
      priorities: new Set(),
      types: new Set(),
      sortBy: '',
      sortDir: 'asc',
    });
    assert.equal(result.length, 2);
  });

  it('sorts by dueDate ascending', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: '2026-03-15T00:00:00Z' }),
      makeTask({ id: 't2', dueDate: '2026-03-01T00:00:00Z' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: 'dueDate',
      sortDir: 'asc',
    });
    assert.equal(result[0]!.id, 't2');
    assert.equal(result[1]!.id, 't1');
  });

  it('sorts by dueDate descending', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: '2026-03-15T00:00:00Z' }),
      makeTask({ id: 't2', dueDate: '2026-03-01T00:00:00Z' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: 'dueDate',
      sortDir: 'desc',
    });
    assert.equal(result[0]!.id, 't1');
  });

  it('tasks without dueDate sort last in asc order', () => {
    const tasks = [
      makeTask({ id: 't1', dueDate: null }),
      makeTask({ id: 't2', dueDate: '2026-03-01T00:00:00Z' }),
    ];
    const result = filterAndSortProjectTasks(tasks, {
      query: '',
      assigneeId: '',
      statuses: new Set(),
      priorities: new Set(),
      types: new Set(),
      sortBy: 'dueDate',
      sortDir: 'asc',
    });
    assert.equal(result[0]!.id, 't2');
    assert.equal(result[1]!.id, 't1');
  });
});

describe('buildBoardData', () => {
  it('groups tasks by status', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo', position: '1000' }),
      makeTask({ id: 't2', status: 'todo', position: '2000' }),
      makeTask({ id: 't3', status: 'done', position: '1000' }),
    ];
    const statuses = ['todo', 'done', 'in_progress'] as const;
    const result = buildBoardData(tasks, statuses);
    assert.equal(result.get('todo')?.length, 2);
    assert.equal(result.get('done')?.length, 1);
    assert.equal(result.get('in_progress')?.length, 0);
  });

  it('sorts tasks within each column by position', () => {
    const tasks = [
      makeTask({ id: 't1', status: 'todo', position: '3000' }),
      makeTask({ id: 't2', status: 'todo', position: '1000' }),
      makeTask({ id: 't3', status: 'todo', position: '2000' }),
    ];
    const statuses = ['todo'] as const;
    const result = buildBoardData(tasks, statuses);
    const todoColumn = result.get('todo')!;
    assert.equal(todoColumn[0]!.id, 't2');
    assert.equal(todoColumn[1]!.id, 't3');
    assert.equal(todoColumn[2]!.id, 't1');
  });
});

describe('buildFractionalTaskPosition', () => {
  it('returns midpoint between two positions', () => {
    const result = buildFractionalTaskPosition({ previousPosition: '1000', nextPosition: '3000' });
    assert.equal(result.position, '2000');
    assert.equal(result.requiresRebalance, false);
  });

  it('returns previous + 1000 when no next position', () => {
    const result = buildFractionalTaskPosition({ previousPosition: '1000' });
    assert.equal(result.position, '2000');
    assert.equal(result.requiresRebalance, false);
  });

  it('returns next - 1000 when no previous position', () => {
    const result = buildFractionalTaskPosition({ nextPosition: '5000' });
    assert.equal(result.position, '4000');
    assert.equal(result.requiresRebalance, false);
  });

  it('marks requiresRebalance when gap too small', () => {
    const result = buildFractionalTaskPosition({
      previousPosition: '1000',
      nextPosition: '1000.00001',
    });
    assert.equal(result.requiresRebalance, true);
  });

  it('handles string positions', () => {
    const result = buildFractionalTaskPosition({ previousPosition: '1000', nextPosition: '2000' });
    assert.equal(result.position, '1500');
  });

  it('falls back to 1000 for invalid positions', () => {
    const result = buildFractionalTaskPosition({
      previousPosition: 'not-a-number',
      nextPosition: 'not-a-number',
    });
    assert.equal(result.position, '1000');
  });
});

describe('toggleSetFilterValue', () => {
  it('adds value when not present', () => {
    const set = new Set<string>();
    const result = toggleSetFilterValue(set, 'todo');
    assert.equal(result.has('todo'), true);
    assert.equal(result.size, 1);
  });

  it('removes value when already present', () => {
    const set = new Set(['todo', 'done']);
    const result = toggleSetFilterValue(set, 'todo');
    assert.equal(result.has('todo'), false);
    assert.equal(result.has('done'), true);
    assert.equal(result.size, 1);
  });
});

describe('isTaskOverdue', () => {
  it('returns true when dueDate is in the past', () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    assert.equal(isTaskOverdue(past), true);
  });

  it('returns false when dueDate is in the future', () => {
    const future = new Date(Date.now() + 86400000).toISOString();
    assert.equal(isTaskOverdue(future), false);
  });

  it('returns false when dueDate is today', () => {
    const today = new Date().toISOString();
    assert.equal(isTaskOverdue(today), false);
  });

  it('returns false when dueDate is undefined', () => {
    assert.equal(isTaskOverdue(undefined), false);
  });

  it('returns false when dueDate is null', () => {
    assert.equal(isTaskOverdue(null), false);
  });
});
