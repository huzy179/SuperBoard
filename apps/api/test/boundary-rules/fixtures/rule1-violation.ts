/**
 * Fixture: Rule 1 — Cross-Domain Service Import violation
 *
 * This file simulates a service inside src/modules/task/ that directly imports
 * a service from src/modules/workspace/ — bypassing NestJS DI.
 *
 * ESLint Boundary Rule 1 should flag this import.
 */

// ❌ VIOLATION: cross-domain service import
import { WorkspaceService } from '../../../src/modules/workspace/workspace.service';

export class TaskServiceViolation {
  constructor(private readonly workspaceService: WorkspaceService) {}
}
