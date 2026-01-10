const CuentaModel = require('../models/Cuenta');

// 1. VER TODAS (Reporte general)
const getCuentas = async (req, res) => {
    try {
        const cuentas = await CuentaModel.findAll();
        res.json(cuentas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. VER POR CLIENTE (Detalle)
const getCuentasCliente = async (req, res) => {
    try {
        const { clienteId } = req.params;
        const cuentas = await CuentaModel.findByClient(clienteId);
        res.json(cuentas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. AGREGAR (Fiar)
const addCuenta = async (req, res) => {
    try {
        const { productos, clienteId } = req.body;

        // Preparamos el array masivo para el modelo
        const registros = [];
        productos.forEach(prod => {
            // Si mandan cantidad: 3, insertamos 3 filas individuales
            const cantidad = prod.cantidad || 1;
            for (let i = 0; i < cantidad; i++) {
                registros.push([
                    clienteId, 
                    prod.ID, 
                    prod.precio, 
                    0 // Estado (puedes quitarlo si tu tabla tiene default)
                ]);
            }
        });

        const insertados = await CuentaModel.add(registros);
        res.json({ success: true, mensaje: 'Productos agregados a cuenta', total: insertados });

    } catch (error) {
        res.status(500).json({ error: 'Error al agregar cuenta' });
    }
};

// 4. SALDAR (Cobrar)
const settleCuenta = async (req, res) => {
    try {
        const { clienteId } = req.body;
        const usuarioId = req.user.userId; // Obtenido del token

        const itemsProcesados = await CuentaModel.settle(clienteId, usuarioId);

        if (itemsProcesados === 0) {
            return res.status(400).json({ error: 'Este cliente no tiene deudas pendientes' });
        }

        res.json({ success: true, mensaje: 'Deuda saldada y registrada en ventas' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al saldar cuenta' });
    }
};


// 5. ELIMINAR UN ÍTEM ESPECÍFICO (Corrección de error)
const deleteCuentaLine = async (req, res) => {
    try {
        const { id } = req.params; // El ID de la fila en la tabla 'cuentas'

        // 1. Verificar si existe el registro
        const current = await CuentaModel.findById(id);
        if (!current) {
            return res.status(404).json({ error: 'El registro de cuenta no existe' });
        }

        // 2. Eliminar
        await CuentaModel.deleteLineItem(id);

        res.json({ success: true, mensaje: 'Producto eliminado de la cuenta correctamente' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al eliminar ítem de la cuenta' });
    }
};

module.exports = { getCuentas, getCuentasCliente, addCuenta, settleCuenta, deleteCuentaLine };