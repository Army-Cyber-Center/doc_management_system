const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/v1/auth", require("./routes/authRoutes"));
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/auth", authRoutes);

app.listen(8000, () => {
  console.log("API Running on http://10.3.0.249/:8000");
});

