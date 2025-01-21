const fs = require('fs');
const path = require('path');

const leerJuegosDesdeArchivo = () => {
  const rutaArchivo = path.join(__dirname, '../src/juegos.json');
  if (fs.existsSync(rutaArchivo)) {
    console.log("\x1b[34m[INFO]\x1b[0m Pasando los juegos del archivo JSON");
    return JSON.parse(fs.readFileSync(rutaArchivo, 'utf-8'));
  }
  console.log("\x1b[31m[ERROR]\x1b[0m No se encontró el archivo JSON");
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

