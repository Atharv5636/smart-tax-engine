const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const errorHandler = require("./utils/errorHandler");
const chatRoutes = require("./routes/chatRoutes");

const app = express();

const allowedOrigins = (process.env.CORS_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("CORS policy blocked this origin"));
    },
    credentials: true,
  })
);
app.use(express.json());
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/ai", require("./routes/aiRoutes"));
app.use("/api/chat", chatRoutes);
app.use("/api/docs", require("./routes/docsRoutes"));
app.use("/api/report", require("./routes/reportRoutes"));
app.use("/api/tax", require("./routes/taxRoutes"));
app.use("/api/tax", require("./routes/simulationRoutes"));
app.use("/api/tax", require("./routes/optimizationRoutes"));
app.use("/api/tax", require("./routes/goalRoutes"));
app.use("/api/tax", require("./routes/taxProfileRoutes"));
app.use("/api/tax", require("./routes/salaryRoutes"));
app.use("/api/tax", require("./routes/capitalGainsRoutes"));
app.use("/api/tax-profile", require("./routes/taxProfileRoutes"));
app.use("/api/salary", require("./routes/salaryRoutes"));

app.get("/", (req, res) => {
  res.status(200).send("API running");
});

if (process.env.NODE_ENV === "production") {
  const clientDistPath = path.join(__dirname, "client", "dist");

  if (fs.existsSync(clientDistPath)) {
    app.use(express.static(clientDistPath));

    app.get(/^\/(?!api).*/, (req, res) => {
      res.sendFile(path.join(clientDistPath, "index.html"));
    });
  }
}

app.use(errorHandler);

module.exports = app;
