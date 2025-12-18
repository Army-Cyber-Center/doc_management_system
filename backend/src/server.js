const express = require("express");
const cors = require("cors");

const app = express();

// ✅ CORS ให้ React (3000) เรียก API (8000) ได้
app.use(cors({
  origin: "http://192.168.2.10:3000",
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());

// routes
app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/documents", require("./routes/documentRoutes")); // ✅ สำคัญ

app.listen(8000, "0.0.0.0", () => {
  console.log("API Running on http://192.168.2.10:8000");
});
