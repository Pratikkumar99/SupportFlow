import "dotenv/config";
import express from "express";
import cors from "cors";
import chatRoutes from "./routes/chat.routes.js";
import { connectDB } from "./config/db.js";
import authRoutes from "./routes/auth.routes.js";
const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    message: "SupportFlow backend is running",
  });
});

app.use("/api/chat", chatRoutes);
app.use("/api/auth", authRoutes);

const PORT = 5000;

app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`Server running on http://localhost:${PORT}`);
  } catch (error) {
    console.log('Error : ', error.message);
  }
});
