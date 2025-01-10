const db = require('../db');


const getAllUsers = async () => {
  const [rows] = await db.query('SELECT * FROM personas');
  return rows;
};

const createUser = async (userData) => {
  const { nombre, email } = userData;
  const [result] = await db.query('INSERT INTO usuarios (nombre, email) VALUES (?, ?)', [nombre, email]);
  return { id: result.insertId, ...userData };
};

module.exports = { getAllUsers, createUser };