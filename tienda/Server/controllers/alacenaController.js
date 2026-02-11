const AlacenaModel = require('../models/Alacena');
const UsuarioModel = require('../models/Usuario');

const getInventario = async (req, res) => {
    try {
        const data = await AlacenaModel.findAll();
        res.json(data);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const crearArticulo = async (req, res) => {
    try {
        // CAMBIO: Capturamos quién lo crea para la bitácora
        const userId = req.user.userId;
        const user = await UsuarioModel.findById(userId);
        const usuarioNombre = user.Nombre_Completo || user.Usuario;

        // Enviamos todo al modelo
        await AlacenaModel.create({
            ...req.body,
            idUsuario: userId,
            usuarioNombre: usuarioNombre
        });

        res.json({ success: true, message: 'Artículo registrado en alacena' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const moverInventario = async (req, res) => {
    try {
        const { idArticulo, tipo, cantidad, motivo } = req.body;
        const userId = req.user.userId;

        // Nombre usuario para log
        const user = await UsuarioModel.findById(userId);
        const usuarioNombre = user.Nombre_Completo || user.Usuario;

        await AlacenaModel.registrarMovimiento({
            idArticulo, tipo, cantidad, motivo, idUsuario: userId, usuarioNombre
        });

        res.json({ success: true, message: 'Movimiento registrado correctamente' });
    } catch (error) { res.status(500).json({ error: error.message }); } // Manejo de errores (ej: stock insuficiente)
};

const getKardex = async (req, res) => {
    try {
        const { id } = req.params;
        const rows = await AlacenaModel.getHistorial(id);
        res.json(rows);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

// ... (imports anteriores) ...

const editarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        await AlacenaModel.update(id, req.body);
        res.json({ success: true, message: 'Artículo actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const eliminarArticulo = async (req, res) => {
    try {
        const { id } = req.params;
        await AlacenaModel.delete(id);
        res.json({ success: true, message: 'Artículo eliminado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const procesarDespensa = async (req, res) => {
    try {
        const { items, motivo } = req.body; // items: array de productos a sacar
        const userId = req.user.userId;

        if (!items || items.length === 0) return res.status(400).json({ error: 'La despensa está vacía' });
        if (!motivo) return res.status(400).json({ error: 'Debes especificar un motivo (ej: Familia Pérez)' });

        const user = await UsuarioModel.findById(userId);
        const usuarioNombre = user.Nombre_Completo || user.Usuario;

        await AlacenaModel.crearDespensa({
            items, motivo, idUsuario: userId, usuarioNombre
        });

        res.json({ success: true, message: 'Despensa entregada y stock actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); } // El mensaje de error traerá qué producto falló
};

const getHistorialGlobal = async (req, res) => {
    try {
        // Extraer filtros de la URL: ?fechaInicio=2024-01-01&busqueda=perez...
        const { fechaInicio, fechaFin, tipo, busqueda } = req.query;
        
        const historial = await AlacenaModel.getGlobalHistory({
            fechaInicio, 
            fechaFin, 
            tipo, 
            busqueda
        });
        
        res.json(historial);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { 
    getInventario, crearArticulo, moverInventario, getKardex, 
    editarArticulo, eliminarArticulo, procesarDespensa, getHistorialGlobal 
};