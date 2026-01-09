const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser'); // <--- 1. IMPORTAR COOKIE-PARSER
const dotenv = require('dotenv'); // <--- 2. IMPORTAR DOTENV
const { connectDB } = require('./config/database');

// Cargar variables de entorno al inicio
dotenv.config(); 

// Importar las rutas
const login = require('./routes/authRoutes'); // ARutas para el Login y Registro de usuarios
const userRoutes = require('./routes/userRoutes');
const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const cuentasRoutes = require('./routes/cuentas');
const ventasRoutes = require('./routes/ventas');

const app = express();
const PORT = process.env.PORT || 3001; // Usar variable de entorno o 3001 por defecto

// ==========================================
// MIDDLEWARES CONFIGURADOS
// ==========================================

// 1. CORS: Configuración para permitir cookies y definir origen
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173', // El origen permitido
  credentials: true // <--- IMPORTANTE: Permite el envío de cookies (tokens)
}));

// 2. JSON: Para entender los body de los requests
app.use(express.json());

// 3. COOKIE PARSER: Para leer las cookies que vienen del navegador
app.use(cookieParser()); 

// ==========================================

// Configurar las rutas
app.use('/api/users', login);
app.use('/api/users', userRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
    cookies: req.cookies ? 'Cookies habilitadas' : 'No se detectan cookies', // Debug
    timestamp: new Date().toISOString()
  });
});

// rutas no encontradas 
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

// Manejo global de errores
app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);
  res.status(500).json({ 
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Ha ocurrido un error'
  });
});

// Iniciar servidor
app.listen(PORT, async () => {
  try {
    await connectDB();
    console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
    console.log(`🔗 Frontend permitido: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
});

// Manejo de cierre graceful
process.on('SIGINT', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Cerrando servidor...');
  process.exit(0);
});

module.exports = app;