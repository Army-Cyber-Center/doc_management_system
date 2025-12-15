const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

const router = express.Router();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT
});

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { username, password, id_army, role } = req.body;

    if (!username || !password || !id_army) {
      return res.status(400).json({ error: 'ข้อมูลไม่ครบ' });
    }

    const hash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (username, password, id_army, role) VALUES (?, ?, ?, ?)',
      [username, hash, id_army, role || 'staff']
    );

    res.json({ message: 'สมัครสมาชิกสำเร็จ' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Register failed' });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const [rows] = await pool.query(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'ไม่พบผู้ใช้' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        role: user.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
