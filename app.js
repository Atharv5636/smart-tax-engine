const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
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

module.exports = app;
