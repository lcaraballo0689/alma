// server.js
const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("¡Hola desde /!");
});

app.get("/api", (req, res) => {
  res.send("¡Hola desde /api!");
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor escuchando en el puerto ${port}`);
});
