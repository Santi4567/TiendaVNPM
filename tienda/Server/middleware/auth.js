/**
 * MIDDLEWARES DE AUTENTICACIÓN Y AUTORIZACIÓN
 * - verifyToken: Verifica que el JWT sea válido
 * - requireAdmin: Verifica que el usuario sea administrador (por rol)
 * - Extrae información del usuario del token incluyendo rol
 * - Manejo de errores de tokens (expirados, inválidos)
 * - Ubicacion middleware/auth.js
 */

const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/Usuario');

const JWT_SECRET = process.env.JWT_SECRET || 'tu_clave_super_secreta_akima_2024';

/**
 * Middleware para verificar JWT
 * (ACTUALIZADO para lógica HÍBRIDA: lee cookie Y encabezado)
 */
const verifyToken = (req, res, next) => {
  try {
    
    // =================================================================
    // CAMBIO: LÓGICA HÍBRIDA (BUSCAR EN COOKIE Y LUEGO EN ENCABEZADO)
    // =================================================================
    let token = null;

    // 1. ¿Viene en una cookie? (Para la aplicación web)
    if (req.cookies && req.cookies.accessToken) {
        token = req.cookies.accessToken;
    }
    // 2. Si no, ¿Viene en el encabezado? (Para la aplicación móvil)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
        token = req.headers.authorization.substring(7); // "Bearer ".length
    }
    // =================================================================

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_REQUERIDO',
        message: 'Se requiere un token de autorización'
      });
    }

    // --- El resto de tu lógica está perfecta y no cambia ---
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = {
      userId: decoded.userId,
      nombre: decoded.nombre,
      correo: decoded.correo,
      rol: decoded.rol || 'vendedor' // Rol por defecto si no está en el token
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_EXPIRADO',
        message: 'El token ha expirado'
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: 'TOKEN_INVALIDO',
        message: 'Token inválido'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al verificar el token'
    });
  }
};

/**
 * Middleware de Admin Seguro (Verifica en BD)
 * 1. Toma el ID del usuario del token.
 * 2. Va a la Base de Datos en tiempo real.
 * 3. Verifica si su rol sigue siendo Admin.
 */
const requireAdminRole = async (req, res, next) => {
  try {
    // El ID viene del middleware anterior (verifyToken)
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'NO_AUTENTICADO',
        message: 'Token inválido o usuario no identificado'
      });
    }

    // --- CONSULTA DE SEGURIDAD EN TIEMPO REAL ---
    // No confiamos en el token, confiamos en la BD
    const userDB = await UsuarioModel.findById(userId);

    if (!userDB) {
      return res.status(401).json({
        success: false,
        error: 'USUARIO_NO_ENCONTRADO',
        message: 'El usuario del token ya no existe'
      });
    }

    // Verifica si la cuenta fue desactivada recientemente
    if (!userDB.Activo) {
        return res.status(403).json({
            success: false,
            error: 'CUENTA_SUSPENDIDA',
            message: 'Tu cuenta ha sido desactivada'
        });
    }

    // Verifica el ROL (1 = Admin)
    const ADMIN_ROLE_ID = 1; 

    // Nota: findById devuelve "ID_Rol" (mayúsculas según tu modelo)
    if (userDB.ID_Rol !== ADMIN_ROLE_ID) {
      return res.status(403).json({
        success: false,
        error: 'ACCESO_DENEGADO',
        message: 'Se requieren permisos de administrador'
      });
    }

    // Si pasó todas las pruebas, adelante
    next();

  } catch (error) {
    console.error('Error en requireAdminRole:', error);
    return res.status(500).json({
      success: false,
      error: 'ERROR_SERVIDOR',
      message: 'Error al verificar permisos'
    });
  }
};

/**
 * Middleware Dinámico de Permisos
 * Uso: router.post('/', requirePermission('add.client'), controller)
 */
const requirePermission = (permisoRequerido) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ error: 'Usuario no autenticado' });
      }

      // 1. Obtener datos del usuario (Rol y Activo)
      const user = await UsuarioModel.findById(userId);
      
      if (!user || !user.Activo) {
        return res.status(403).json({ error: 'Cuenta inactiva o no encontrada' });
      }

      // 2. MODO DIOS: Si es ADMIN (ID 1), pasa siempre
      const ADMIN_ROLE_ID = 1;
      if (user.ID_Rol === ADMIN_ROLE_ID) {
        return next(); // <--- El Admin se salta la verificación
      }

      // 3. Si no es Admin, buscamos sus permisos
      const permisosUsuario = await UsuarioModel.getPermissions(userId);

      // 4. Verificamos si tiene el permiso exacto
      if (!permisosUsuario.includes(permisoRequerido)) {
        return res.status(403).json({
          success: false,
          error: 'ACCESO_DENEGADO',
          message: `No tienes permiso para realizar esta acción. Requieres: ${permisoRequerido}`
        });
      }

      next();

    } catch (error) {
      console.error('Error en requirePermission:', error);
      res.status(500).json({ error: 'Error al verificar permisos' });
    }
  };
};

module.exports = {
  verifyToken,
  requireAdmin: requireAdminRole, requirePermission,// Mantenemos el nombre original para compatibilidad
  JWT_SECRET //<-- SI se ocupa, no lo borres (Dont delete)
};