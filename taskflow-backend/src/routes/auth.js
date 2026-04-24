import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { pool } from "../db/pool.js";

const router = Router();

const registerSchema = z.object({
  name: z.string().trim().min(2).max(80),
  email: z.string().trim().email().max(255),
  password: z.string().min(6).max(100),
  organizationName: z.string().trim().min(2).max(80),
});

const loginSchema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(1).max(100),
});

function sign(user) {
  return jwt.sign(
    {
      userId: user.id,
      organizationId: user.organization_id,
      role: user.role,
      name: user.name,
      email: user.email,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );
}

router.post("/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input", errors: parsed.error.flatten() });
  const { name, email, password, organizationName } = parsed.data;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const exists = await client.query("SELECT 1 FROM users WHERE email=$1", [email]);
    if (exists.rowCount) {
      await client.query("ROLLBACK");
      return res.status(409).json({ message: "Email already registered" });
    }
    const org = await client.query(
      "INSERT INTO organizations(name) VALUES($1) RETURNING id, name",
      [organizationName]
    );
    const hash = await bcrypt.hash(password, 10);
    const u = await client.query(
      `INSERT INTO users(name,email,password,role,organization_id)
       VALUES($1,$2,$3,'owner',$4)
       RETURNING id, name, email, role, organization_id`,
      [name, email, hash, org.rows[0].id]
    );
    await client.query("COMMIT");
    res.status(201).json({ token: sign(u.rows[0]) });
  } catch (e) {
    await client.query("ROLLBACK");
    console.error(e);
    res.status(500).json({ message: "Server error" });
  } finally {
    client.release();
  }
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ message: "Invalid input" });
  const { email, password } = parsed.data;
  const r = await pool.query(
    "SELECT id, name, email, password, role, organization_id FROM users WHERE email=$1",
    [email]
  );
  if (!r.rowCount) return res.status(401).json({ message: "Invalid credentials" });
  const ok = await bcrypt.compare(password, r.rows[0].password);
  if (!ok) return res.status(401).json({ message: "Invalid credentials" });
  res.json({ token: sign(r.rows[0]) });
});

export default router;
