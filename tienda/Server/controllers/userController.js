const bcrypt = require('bcrypt');
const UsuarioModel = require('../models/Usuario');

// CREAR USUARIO (Register)
const createUser = async (req, res) => {
    try {
        const { Usuario, Nombre_Completo, Passwd, ID_Rol } = req.body;

        // 1. Verificar si ya existe
        const exists = await UsuarioModel.exists(Usuario);
        if (exists) {
            return res.status(400).json({ message: 'El usuario ya existe' });
        }

        // 2. Hash Password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(Passwd, salt);

        // 3. Crear
        const newId = await UsuarioModel.create({
            usuario: Usuario,
            nombreCompleto: Nombre_Completo,
            passwd: hashedPassword,
            idRol: ID_Rol
        });

        res.status(201).json({ success: true, id: newId, message: 'Usuario creado' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// MODIFICAR USUARIO
const updateUser = async (req, res) => {
    try {
        const { id } = req.params; // El ID viene en la URL: /api/users/1
        const { Usuario, Nombre_Completo, ID_Rol, Activo } = req.body;

        // 1. Verificar si el usuario existe antes de editar
        const currentData = await UsuarioModel.findById(id);
        if (!currentData) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // 2. Actualizar
        await UsuarioModel.update(id, {
            usuario: Usuario,
            nombreCompleto: Nombre_Completo,
            idRol: ID_Rol,
            activo: Activo !== undefined ? Activo : currentData.Activo
        });

        res.status(200).json({ success: true, message: 'Usuario actualizado' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Agrega esta función a tu controlador
const getProfile = async (req, res) => {
    try {
        // req.user viene del middleware verifyToken
        const userId = req.user.userId;

        const profile = await UsuarioModel.getProfile(userId);

        if (!profile) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({
            success: true,
            data: profile
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener perfil' });
    }
};

// OBTENER TODOS LOS USUARIOS
const getAllUsers = async (req, res) => {
    try {
        const users = await UsuarioModel.findAll();
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// BUSCAR POR ID (Para que el admin vea detalles de otro usuario)
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await UsuarioModel.findById(id);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        // El modelo findById ya hace JOIN con roles, así que devolvemos directo
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// BUSCAR POR USERNAME
const getUserByUsername = async (req, res) => {
    try {
        const { username } = req.params;
        const user = await UsuarioModel.findByUsername(username);

        if (!user) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        // IMPORTANTE: findByUsername devuelve el password (para el login), 
        // así que aquí debemos quitarlo antes de enviarlo al frontend.
        const { Passwd, ...userWithoutPassword } = user;

        res.status(200).json({ success: true, data: userWithoutPassword });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ELIMINAR USUARIO (Desactivar)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        // Evitar que el admin se borre a sí mismo
        if (parseInt(id) === req.user.userId) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
        }

        const success = await UsuarioModel.delete(id);
        
        if (!success) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.status(200).json({ success: true, message: 'Usuario desactivado correctamente' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


module.exports = { 
    createUser, 
    updateUser, 
    getProfile, 
    getAllUsers, 
    getUserById, 
    getUserByUsername, 
    deleteUser 
};