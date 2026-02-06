const LibroModel = require('../models/Libro');

const getTodos = async (req, res) => {
    try {
        const libros = await LibroModel.findAll();
        res.json(libros);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const buscarLibros = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const libros = await LibroModel.search(q);
        res.json(libros);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const crearLibro = async (req, res) => {
    try {
        const { titulo, precio } = req.body;
        if (!titulo || !precio) return res.status(400).json({ error: 'Título y Precio son obligatorios' });
        
        const id = await LibroModel.create(req.body);
        res.json({ success: true, message: 'Libro registrado', id });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const editarLibro = async (req, res) => {
    try {
        const { id } = req.params;
        await LibroModel.update(id, req.body);
        res.json({ success: true, message: 'Libro actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const eliminarLibro = async (req, res) => {
    try {
        const { id } = req.params;
        await LibroModel.delete(id);
        res.json({ success: true, message: 'Libro eliminado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
};

module.exports = { getTodos, buscarLibros, crearLibro, editarLibro, eliminarLibro };