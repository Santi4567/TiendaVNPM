const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');

// Importar las rutas
const productosRoutes = require('./routes/productos');
const clientesRoutes = require('./routes/clientes');
const cuentasRoutes = require('./routes/cuentas');
const ventasRoutes = require('./routes/ventas');

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Configurar las rutas
app.use('/api/productos', productosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cuentas', cuentasRoutes);
app.use('/api/ventas', ventasRoutes);

// Ruta de prueba para verificar que el servidor está funcionando
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Servidor funcionando correctamente',
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
    console.log(`📊 API disponible en http://localhost:${PORT}/api`);
    console.log(`🏥 Health check en http://localhost:${PORT}/api/health`);
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