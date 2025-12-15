import db from "../config/db.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import jwt from "jsonwebtoken";
import { registerUser, loginUser } from "../services/authService.js";

const SECRET = "MY_SECRET_KEY";

export const register = async (req, res) => {
  const { username, password, id_army, role } = req.body;

  if (!username || !password || !id_army)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const { hashed, salt } = await hashPassword(password);

    await db.query(
      "INSERT INTO users (username, password, salt, id_army, role) VALUES (?, ?, ?, ?, ?)",
      [username, hashed, salt, id_army, role || "staff"]
    );

    res.json({ message: "Registered" });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};


export async function register(req, res) {
  try {
    const id = await registerUser(req.body);

    const response = {
      id,
      username: req.body.username,
      role: req.body.role || "user",
      id_army: req.body.id_army,
      is_active: true,
      last_login: null,
      created_at: new Date(),
    };

    res.status(201).json(response);
  } catch (err) {
    res.status(422).json({
      detail: [
        { loc: ["body"], msg: err.message, type: "validation" }
      ]
    });
  }
}

export async function login(req, res) {
  try {
    const { username, password } = req.body;
    const user = await loginUser(username, password);
    res.json(user);
  } catch (err) {
    res.status(401).json({ message: err.message });
  }
}
