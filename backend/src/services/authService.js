import db from "../config/db.js";
import { hashPassword, verifyPassword } from "../utils/hash.js";

export async function registerUser(data) {
  const { username, password, id_army, role } = data;

  // Check duplicate
  const [exists] = await db.query(
    "SELECT id FROM users WHERE username = ? OR id_army = ?",
    [username, id_army]
  );

  if (exists.length > 0) throw new Error("User already exists");

  // Hash password
  const { hashed, salt } = await hashPassword(password);

  // Insert
  const [result] = await db.query(
    `INSERT INTO users (username, password, salt, id_army, role) 
     VALUES (?, ?, ?, ?, ?)`,
    [username, hashed, salt, id_army, role || "user"]
  );

  return result.insertId;
}

export async function loginUser(username, password) {
  const [rows] = await db.query("SELECT * FROM users WHERE username = ?", [
    username,
  ]);

  if (rows.length === 0) throw new Error("User not found");

  const user = rows[0];
  const isMatch = await verifyPassword(password, user.password);

  if (!isMatch) throw new Error("Invalid password");

  // Update last login
  await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [
    user.id,
  ]);

  delete user.password;
  delete user.salt;
  return user;
}
