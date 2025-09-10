const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: 'localhost',
  user: 'root', 
  password: '', 
  database: 'tienda'
};

let db;

// Función para conectar a la base de datos
async function connectDB() {
  try {
    db = await mysql.createConnection(dbConfig);
    console.log('Conectado a MySQL');
    return db;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    throw error;
  }
}

// Función para obtener la conexión
function getDB() {
  if (!db) {
    throw new Error('Base de datos no conectada. Llama a connectDB() primero.');
  }
  return db;
}

module.exports = {
  connectDB,
  getDB
};