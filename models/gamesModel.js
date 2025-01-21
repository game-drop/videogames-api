const fs = require('fs');
const path = require('path');

const leerJuegosDesdeArchivo = () => {
  const rutaArchivo = path.join(__dirname, 'juegos.json');
  if (fs.existsSync(rutaArchivo)) {
    return JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));
  }
  return [];
};

const getSteam = () => {
  const juegos = leerJuegosDesdeArchivo();
  return juegos.filter(juego => juego.platform === 'steam');
};

const getEneba = () => {
  const juegos = leerJuegosDesdeArchivo();
  return juegos.filter(juego => juego.platform === 'eneba');
};


// Exportamos las funciones para su uso en otros módulos
module.exports = { getSteam, getEneba };

