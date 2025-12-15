import express from "express";
import bcrypt from "bcrypt";
import db from "../config/db.js"; // ใช้ connection pool MySQL ของคุณ

const router = express.Router();

// ==========================
// POST /api/register
// ==========================
router.post("/register",registerUser, async (req, res) => {
  try {
    const { username, password, id_army, role } = req.body;

    // -----------------------
    // Validate input
    //-----------------------
    if (!username || !password || !id_army) {
      return res.status(422).json({
        detail: [
          { loc: ["body", "username"], msg: "username required", type: "validation" }
        ]
      });
    }

    // Check if user exists already
    const [existing] = await db.query(
      "SELECT id FROM users WHERE username = ? OR id_army = ?",
      [username, id_army]
    );

    if (existing.length > 0) {
      return res.status(422).json({
        detail: [
          { loc: ["body", "username"], msg: "User already exists", type: "validation" }
        ]
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(password, salt);

    // Insert user
    const [result] = await db.query(
      `INSERT INTO users (username, password, salt, id_army, role) 
       VALUES (?, ?, ?, ?, ?)`,
      [username, hashed, salt, id_army, role || "user"]
    );

    const userId = result.insertId;

    // Query newly created user
    const [user] = await db.query(
      `SELECT id, username, role, id_army, is_active, last_login, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    res.status(201).json(user[0]);

  } catch (err) {
    console.error("Register Error:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;
