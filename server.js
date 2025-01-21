const express = require('express');
const cors = require('cors')

const gamesRoutes = require('./routes/gamesRoutes');
require('./src/auto');

const app = express();

const PORT = 3000;
const RUTA = '/';


app.use(cors({
  origin: 'https://wombadeals.com/', // URL exacta de tu aplicación frontend
  // origin: 'http://localhost:5173', // URL exacta de tu aplicación frontend
  credentials: true, // Permitir cookies si las necesitas
}));

app.use(express.json());

// Rutas
app.use(RUTA, gamesRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`\x1b[32m[SERVER]\x1b[0m Funcionando en http://localhost:${PORT}`);
});