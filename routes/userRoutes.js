const express = require('express');
const router = express.Router();
const userModel = require('../models/userModel');

// Ruta de prueba
router.get('/test', (req, res) => {
    res.send('Rutas de usuarios funcionando :)');
  });
  
// Obtener todos los usuarios
router.get('/', async (req, res) => {
  try {
    const users = await userModel.getAllUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Crear un usuario
router.post('/', async (req, res) => {
  try {
    const newUser = await userModel.createUser(req.body);
    res.status(201).json(newUser);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
