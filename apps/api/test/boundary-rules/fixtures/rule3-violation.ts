/**
 * Fixture: Rule 3 — packages/shared importing from apps/* violation
 *
 * This file simulates a file inside packages/shared/src/ that imports from
 * apps/api/src/ — creating a circular dependency and coupling the shared
 * contract package to a specific runtime.
 *
 * ESLint Boundary Rule 3 should flag this import.
 */

// ❌ VIOLATION: shared package importing from apps/api
import { TaskService } from '../../../apps/api/src/modules/task/task.service';

export type SharedTaskRef = typeof TaskService;
