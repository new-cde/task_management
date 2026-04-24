import { Router } from "express";
import { z } from "zod";
import { pool } from "../db/pool.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
router.use(authRequired);

const taskSchema = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).optional().or(z.literal("")).transform((v) => v || null),
});

async function logAction(taskId, orgId, action, userId) {
  try {
    await pool.query(
      "INSERT INTO task_logs(task_id, organization_id, action, performed_by) VALUES($1,$2,$3,$4)",
      [taskId, orgId, action, userId]
    );
  } catch (e) {
    console.error("audit log failed", e);
  }
}

function canModify(user, task) {
  return user.role === "owner" || user.role === "admin" || task.created_by === user.userId;
}

// GET /tasks  — admins/owners see all org tasks, members see their own
router.get("/", async (req, res) => {
  const { userId, organizationId, role } = req.user;
  const q =
    role === "member"
      ? "SELECT * FROM tasks WHERE organization_id=$1 AND created_by=$2 ORDER BY created_at DESC"
      : "SELECT * FROM tasks WHERE organization_id=$1 ORDER BY created_at DESC";
  const params = role === "member" ? [organizationId, userId] : [organizationId];
  const r = await pool.query(q, params);
  res.json(r.rows);
});

router.get("/:id", async (req, res) => {
  const { organizationId, userId, role } = req.user;
  const r = await pool.query("SELECT * FROM tasks WHERE id=$1 AND organization_id=$2", [
    req.params.id,
    organizationId,
  ]);
  if (!r.rowCount) return res.status(404).json({ message: "Not found" });
  const t = r.rows[0];
  if (role === "member" && t.created_by !== userId)
    return res.status(403).json({ message: "Forbidden" });
  res.json(t);
});

router.post("/", async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
  const { title, description } = parsed.data;
  const { userId, organizationId } = req.user;
  const r = await pool.query(
    `INSERT INTO tasks(title, description, created_by, organization_id)
     VALUES($1,$2,$3,$4) RETURNING *`,
    [title, description, userId, organizationId]
  );
  await logAction(r.rows[0].id, organizationId, "created", userId);
  res.status(201).json(r.rows[0]);
});

router.put("/:id", async (req, res) => {
  const parsed = taskSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
  const { organizationId, userId } = req.user;
  const found = await pool.query("SELECT * FROM tasks WHERE id=$1 AND organization_id=$2", [
    req.params.id,
    organizationId,
  ]);
  if (!found.rowCount) return res.status(404).json({ message: "Not found" });
  if (!canModify(req.user, found.rows[0])) return res.status(403).json({ message: "Forbidden" });

  const { title, description } = parsed.data;
  const r = await pool.query(
    `UPDATE tasks SET title=$1, description=$2, updated_at=now()
     WHERE id=$3 AND organization_id=$4 RETURNING *`,
    [title, description, req.params.id, organizationId]
  );
  await logAction(r.rows[0].id, organizationId, "updated", userId);
  res.json(r.rows[0]);
});

router.delete("/:id", async (req, res) => {
  const { organizationId, userId } = req.user;
  const found = await pool.query("SELECT * FROM tasks WHERE id=$1 AND organization_id=$2", [
    req.params.id,
    organizationId,
  ]);
  if (!found.rowCount) return res.status(404).json({ message: "Not found" });
  if (!canModify(req.user, found.rows[0])) return res.status(403).json({ message: "Forbidden" });

  await pool.query("DELETE FROM tasks WHERE id=$1 AND organization_id=$2", [
    req.params.id,
    organizationId,
  ]);
  await logAction(req.params.id, organizationId, "deleted", userId);
  res.status(204).end();
});

export default router;
