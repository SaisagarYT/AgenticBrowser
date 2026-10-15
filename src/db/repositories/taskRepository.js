"use strict";

import { getDatabase } from "../database.js";

export class TaskRepository {
  static create({ id, command }) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO tasks (id, command, status, created_at, updated_at)
      VALUES (?, ?, 'PENDING', ?, ?)
    `);
    stmt.run(id, command, now, now);
    return this.getById(id);
  }

  static getById(id) {
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM tasks WHERE id = ?`);
    return stmt.get(id) || null;
  }

  static list({ limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM tasks ORDER BY created_at DESC LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  static updateStatus(id, status, error = null) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE tasks SET status = ?, error = ?, updated_at = ? WHERE id = ?
    `);
    stmt.run(status, error, now, id);
  }

  static complete(id, finalResponse, totalSteps, durationMs) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = 'COMPLETED', final_response = ?, total_steps = ?, duration_ms = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(finalResponse, totalSteps, durationMs, now, id);
  }

  static fail(id, error, totalSteps, durationMs) {
    const db = getDatabase();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      UPDATE tasks 
      SET status = 'FAILED', error = ?, total_steps = ?, duration_ms = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(error, totalSteps, durationMs, now, id);
  }

  static getFullTaskDetails(id) {
    const db = getDatabase();
    const task = this.getById(id);
    if (!task) return null;

    const planStmt = db.prepare(`SELECT * FROM plans WHERE task_id = ? ORDER BY version DESC LIMIT 1`);
    const plan = planStmt.get(id) || null;

    const stepsStmt = db.prepare(`SELECT * FROM plan_steps WHERE task_id = ? ORDER BY step_number ASC`);
    const steps = stepsStmt.all(id) || [];

    const actionsStmt = db.prepare(`SELECT * FROM actions WHERE task_id = ? ORDER BY created_at ASC`);
    const actions = actionsStmt.all(id) || [];

    const critiquesStmt = db.prepare(`SELECT * FROM critiques WHERE task_id = ? ORDER BY created_at ASC`);
    const critiques = critiquesStmt.all(id) || [];

    return {
      task,
      plan,
      steps,
      actions,
      critiques,
    };
  }

  static delete(id) {
    const db = getDatabase();
    const stmt = db.prepare(`DELETE FROM tasks WHERE id = ?`);
    stmt.run(id);
  }
}
