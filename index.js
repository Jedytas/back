const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoute");
const taskRoutes = require("./routes/taskRoute");
const testRoute = require("./routes/testRoute");

dotenv.config();
const app = express();
connectDB();

// CORS
app.use(cors());

// Обработка preflight-запросов (OPTIONS)
app.options('*', (req, res) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.sendStatus(200);
});

// Заголовки CORS для всех запросов
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  next();
});

// JSON парсер
app.use(express.json());

// Роуты
app.use("/api/auth", authRoutes);
app.use("/api/task", taskRoutes);
app.use("/api", testRoute);

// Запуск сервера
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
