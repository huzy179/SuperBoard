/**
 * Fixture: Rule 2 — Controller Bypassing Service Layer violation
 *
 * This file simulates a controller that directly imports a repository file,
 * bypassing the service layer.
 *
 * ESLint Boundary Rule 2 should flag this import.
 */

// ❌ VIOLATION: controller importing repository directly
import { TaskRepository } from '../../../src/modules/task/task.repository';

export class TaskControllerViolation {
  constructor(private readonly taskRepository: TaskRepository) {}
}
