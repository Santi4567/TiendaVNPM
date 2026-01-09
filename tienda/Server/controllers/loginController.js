const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/Usuario'); // Importamos tu Modelo
const { JWT_SECRET } = require('../middleware/auth'); // Asegúrate de exportar esto en tu auth.js

const login = async (req, res) => {
    try {
        // A. Los datos ya vienen limpios gracias al Validator
        const { Usuario, Passwd } = req.body;

        // B. Buscar usuario usando el MODELO (Nada de SQL aquí)
        const user = await UsuarioModel.findByUsername(Usuario);

        // C. Validaciones de negocio
        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'CREDENCIALES_INVALIDAS',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // D. Verificar si está activo
        if (!user.Activo) {
            return res.status(403).json({
                success: false,
                error: 'CUENTA_INACTIVA',
                message: 'Tu cuenta está desactivada. Contacta al administrador.'
            });
        }

        // E. Comparar contraseña (Hash vs Texto plano)
        const isPasswordValid = await bcrypt.compare(Passwd, user.Passwd);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                error: 'CREDENCIALES_INVALIDAS',
                message: 'Usuario o contraseña incorrectos'
            });
        }

        // F. Generar JWT
        // NOTA: Como el modelo findByUsername devuelve "SELECT *", 
        // a veces es bueno hacer una segunda consulta o un JOIN si necesitas el nombre del rol.
        // Asumiendo que user tiene ID_Rol, podemos guardar eso.
        const tokenPayload = {
            userId: user.ID,
            usuario: user.Usuario,
            nombre: user.Nombre_Completo,
            rolId: user.ID_Rol
            // Puedes agregar el nombre del rol aquí si modificas el Modelo para traerlo
        };

        const token = jwt.sign(tokenPayload, JWT_SECRET, {
            expiresIn: '12h'
        });

        // G. Configurar Cookie (Para la Web)
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 12 * 60 * 60 * 1000,
            path: '/'
        };

        res.cookie('accessToken', token, cookieOptions);

        // H. Respuesta Final
        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                token: token, // Para App Móvil
                user: {
                    id: user.ID,
                    usuario: user.Usuario,
                    nombre: user.Nombre_Completo,
                    rolId: user.ID_Rol
                }
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = { login };