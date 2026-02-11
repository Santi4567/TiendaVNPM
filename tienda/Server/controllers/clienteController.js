const ClienteModel = require('../models/Cliente');

// 1. OBTENER TODOS
const getClients = async (req, res) => {
    try {
        const clients = await ClienteModel.findAll();
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. BUSCAR (Para la barra de búsqueda)
const searchClients = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);

        const clients = await ClienteModel.searchByName(q);
        res.json(clients);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. CREAR
const createClient = async (req, res) => {
    try {
        const { nombre } = req.body;

        // Validar Duplicado
        const existing = await ClienteModel.findByName(nombre);
        if (existing) {
            return res.status(400).json({ error: 'Ya existe un cliente con ese nombre' });
        }

        const newId = await ClienteModel.create(nombre);
        res.json({ success: true, mensaje: 'Cliente agregado', clienteId: newId });

    } catch (error) {
        res.status(500).json({ error: 'Error al crear cliente' });
    }
};

// 4. EDITAR
const updateClient = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;

        // Validar que el cliente exista
        const currentClient = await ClienteModel.findById(id);
        if (!currentClient) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        // Validar nombre duplicado (pero que no sea él mismo)
        const duplicate = await ClienteModel.findByName(nombre);
        if (duplicate && duplicate.ID != id) {
            return res.status(400).json({ error: 'Ya existe otro cliente con ese nombre' });
        }

        await ClienteModel.update(id, nombre);
        res.json({ success: true, mensaje: 'Cliente actualizado' });

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

// 5. ELIMINAR
const deleteClient = async (req, res) => {
    try {
        const { id } = req.params;

        // REGLA DE NEGOCIO: No borrar si debe dinero (tiene cuentas)
        const hasDebts = await ClienteModel.hasPendingCuentas(id);
        if (hasDebts) {
            return res.status(400).json({ 
                error: 'No se puede eliminar: El cliente tiene cuentas pendientes' 
            });
        }

        const success = await ClienteModel.delete(id);
        if (!success) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, mensaje: 'Cliente eliminado' });

    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar:Historico comprometido' });
    }
};

module.exports = {
    getClients,
    searchClients,
    createClient,
    updateClient,
    deleteClient
};