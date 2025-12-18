require('dotenv').config();
const express = require('express');
const app = express();

// Require router
const testRoutes = require('./src/routes/test-db'); // เพิ่ม src

app.use(cors()); // สำคัญมาก: เพื่อให้ React ยิงหา Node.js ได้
app.use(express.json());

// Middleware
app.use(express.json());
app.use(testRoutes); // <-- ใส่ router
// ใช้งาน Routes
app.use('/api', ocrRoutes);
// Start server
const PORT = process.env.PORT_NODE || 8000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API running on port ${PORT}`);
});
