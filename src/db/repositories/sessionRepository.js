"use strict";

import { getDatabase } from "../database.js";
import { randomUUID } from "node:crypto";

export class SessionRepository {
  /**
   * Create a new chat session thread
   */
  static create({ id = null, title = "New AI Chat", model = null }) {
    const db = getDatabase();
    const sessionId = id || `sess_${Date.now()}_${randomUUID().slice(0, 8)}`;
    const now = new Date().toISOString();
    const cleanTitle = (title || "New AI Chat").trim().slice(0, 120);

    const stmt = db.prepare(`
      INSERT INTO sessions (id, title, model, status, total_turns, created_at, updated_at)
      VALUES (?, ?, ?, 'ACTIVE', 0, ?, ?)
    `);
    stmt.run(sessionId, cleanTitle, model, now, now);
    return this.getById(sessionId);
  }

  /**
   * Fetch session metadata by ID
   */
  static getById(id) {
    if (!id) return null;
    const db = getDatabase();
    const stmt = db.prepare(`SELECT * FROM sessions WHERE id = ?`);
    return stmt.get(id) || null;
  }

  /**
   * Update session timestamp, status, and turn count
   */
  static touch(id, { status = null, model = null } = {}) {
    if (!id) return;
    const db = getDatabase();
    const now = new Date().toISOString();

    // Calculate actual turn count from tasks
    const countRow = db.prepare(`SELECT COUNT(*) as count FROM tasks WHERE session_id = ?`).get(id);
    const turnCount = countRow ? countRow.count : 0;

    if (status && model) {
      db.prepare(`
        UPDATE sessions 
        SET updated_at = ?, status = ?, model = ?, total_turns = ?
        WHERE id = ?
      `).run(now, status, model, turnCount, id);
    } else if (status) {
      db.prepare(`
        UPDATE sessions 
        SET updated_at = ?, status = ?, total_turns = ?
        WHERE id = ?
      `).run(now, status, turnCount, id);
    } else {
      db.prepare(`
        UPDATE sessions 
        SET updated_at = ?, total_turns = ?
        WHERE id = ?
      `).run(now, turnCount, id);
    }
  }

  /**
   * Update session title (e.g., auto-generated from user's first prompt)
   */
  static updateTitle(id, title) {
    if (!id || !title) return;
    const db = getDatabase();
    const now = new Date().toISOString();
    const cleanTitle = title.trim().slice(0, 120);
    db.prepare(`UPDATE sessions SET title = ?, updated_at = ? WHERE id = ?`).run(cleanTitle, now, id);
  }

  /**
   * List recent chat sessions ordered by latest activity
   */
  static list({ limit = 50, offset = 0 } = {}) {
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT 
        s.id,
        s.title,
        s.model,
        s.status,
        s.created_at,
        s.updated_at,
        COUNT(t.id) as turn_count,
        (SELECT t2.status FROM tasks t2 WHERE t2.session_id = s.id ORDER BY t2.created_at DESC LIMIT 1) as latest_status,
        (SELECT t2.command FROM tasks t2 WHERE t2.session_id = s.id ORDER BY t2.created_at DESC LIMIT 1) as latest_command
      FROM sessions s
      LEFT JOIN tasks t ON t.session_id = s.id
      GROUP BY s.id
      ORDER BY s.updated_at DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  /**
   * Retrieve full conversation session thread including all turns, plans, actions, and critiques
   */
  static getFullSession(sessionId) {
    if (!sessionId) return null;
    const db = getDatabase();
    const session = this.getById(sessionId);
    if (!session) return null;

    // Fetch all tasks (turns) for this session in chronological order
    const tasksStmt = db.prepare(`
      SELECT * FROM tasks WHERE session_id = ? ORDER BY created_at ASC
    `);
    const tasks = tasksStmt.all(sessionId) || [];

    const planStmt = db.prepare(`SELECT * FROM plans WHERE task_id = ? ORDER BY version DESC LIMIT 1`);
    const stepsStmt = db.prepare(`SELECT * FROM plan_steps WHERE task_id = ? ORDER BY step_number ASC`);
    const actionsStmt = db.prepare(`SELECT * FROM actions WHERE task_id = ? ORDER BY step_number ASC, created_at ASC`);
    const critiquesStmt = db.prepare(`SELECT * FROM critiques WHERE task_id = ? ORDER BY step_number ASC`);

    const turns = tasks.map((task) => {
      const plan = planStmt.get(task.id) || null;
      const steps = stepsStmt.all(task.id) || [];
      const actions = actionsStmt.all(task.id) || [];
      const critiques = critiquesStmt.all(task.id) || [];

      return {
        task,
        plan,
        steps,
        actions,
        critiques,
      };
    });

    return {
      session,
      turns,
    };
  }

  /**
   * Retrieve prior turns summary for LLM multi-turn conversation context
   */
  static getRecentTurnsContext(sessionId, limit = 4) {
    if (!sessionId) return [];
    const db = getDatabase();
    const stmt = db.prepare(`
      SELECT command, final_response, status 
      FROM tasks 
      WHERE session_id = ? AND (status = 'COMPLETED' OR final_response IS NOT NULL)
      ORDER BY created_at ASC 
      LIMIT ?
    `);
    return stmt.all(sessionId, limit);
  }

  /**
   * Delete an entire chat session and cascade-delete all its tasks and associated records
   */
  static delete(sessionId) {
    if (!sessionId) return;
    const db = getDatabase();
    try {
      // Find all tasks under this session
      const tasks = db.prepare(`SELECT id FROM tasks WHERE session_id = ?`).all(sessionId);
      for (const t of tasks) {
        db.prepare(`DELETE FROM critiques WHERE task_id = ?`).run(t.id);
        db.prepare(`DELETE FROM actions WHERE task_id = ?`).run(t.id);
        db.prepare(`DELETE FROM plan_steps WHERE task_id = ?`).run(t.id);
        db.prepare(`DELETE FROM plans WHERE task_id = ?`).run(t.id);
        db.prepare(`DELETE FROM logs WHERE task_id = ?`).run(t.id);
      }
      db.prepare(`DELETE FROM tasks WHERE session_id = ?`).run(sessionId);
      db.prepare(`DELETE FROM sessions WHERE id = ?`).run(sessionId);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Clear all sessions and associated history
   */
  static clearAll() {
    const db = getDatabase();
    try {
      db.prepare(`DELETE FROM critiques`).run();
      db.prepare(`DELETE FROM actions`).run();
      db.prepare(`DELETE FROM plan_steps`).run();
      db.prepare(`DELETE FROM plans`).run();
      db.prepare(`DELETE FROM logs`).run();
      db.prepare(`DELETE FROM tasks`).run();
      db.prepare(`DELETE FROM sessions`).run();
      return true;
    } catch {
      return false;
    }
  }
}
