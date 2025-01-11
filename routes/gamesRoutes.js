const express = require('express');
const router = express.Router();
const gamesModel = require('../models/gamesModel');

// Ruta de prueba
router.get('/test', (req, res) => {
    res.send('Rutas Funcionando Correctamente');
});

// Obtener todos los juegos de steam
router.get('/steam', async (req, res) => {
  try {
    const games = await gamesModel.getSteam();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los juegos de eneba
router.get('/eneba', async (req, res) => {
  try {
    const games = await gamesModel.getEneba();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Obtener todos los juegos de gog
router.get('/gog', async (req, res) => {
  try {
    const games = await gamesModel.getGog();
    res.json(games);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;