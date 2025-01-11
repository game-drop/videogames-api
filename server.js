const express = require('express');
const gamesRoutes = require('./routes/gamesRoutes');

const app = express();

const PORT = 3000;
const RUTA = '/';


// Middleware para parsear JSON
app.use(express.json());

// Rutas
app.use(RUTA, gamesRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});