const express = require('express');
const cors = require('cors')

const gamesRoutes = require('./routes/gamesRoutes');

const app = express();

const PORT = 3000;
const RUTA = '/';
const WEB = 'http://localhost:5173/';


// Middleware para parsear JSON
app.use(cors({
  origin: WEB, // URL de tu aplicación Vue (ajusta el puerto según corresponda)
  credentials: true // Si necesitas enviar cookies
})) 

app.use(express.json());

// Rutas
app.use(RUTA, gamesRoutes);

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});