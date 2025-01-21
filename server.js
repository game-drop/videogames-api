const express = require('express');
const cors = require('cors')

const gamesRoutes = require('./routes/gamesRoutes');
require('./src/auto');

const app = express();

const PORT = 3000;
const RUTA = '/';


app.use(cors({
  origin: 'http://localhost:5173', // URL exacta de tu aplicación frontend
  credentials: true, // Permitir cookies si las necesitas
}));

app.use(express.json());

// Rutas
app.use(RUTA, gamesRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});