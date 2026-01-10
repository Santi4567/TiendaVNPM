const VentaModel = require('../models/Venta');

// 1. FINALIZAR VENTA
const crearVenta = async (req, res) => {
    try {
        const { productos, idCliente } = req.body;
        const idUsuario = req.user.userId; // <-- Viene del Token (verifyToken)

        // Llamamos al modelo con toda la info necesaria
        const itemsVendidos = await VentaModel.create({
            productos,
            idCliente,
            idUsuario
        });

        res.json({ 
            success: true, 
            mensaje: 'Venta registrada con éxito',
            items: itemsVendidos 
        });

    } catch (error) {
        console.error('Error en venta:', error);
        // Si el error es por stock, enviamos 400, si no 500
        if (error.message.includes('Stock insuficiente')) {
            return res.status(400).json({ error: error.message });
        }
        res.status(500).json({ error: 'Error al procesar la venta' });
    }
};

// 2. REPORTE DIARIO (Atajo)
const getReporteHoy = async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0]; // '2025-01-20'
        const ventas = await VentaModel.getByDateRange(hoy, hoy);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. REPORTE POR FECHA
const getReporteFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const ventas = await VentaModel.getByDateRange(fecha, fecha);
        res.json(ventas);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 4. TOTALES (Dashboard KPI)
const getTotalesFecha = async (req, res) => {
    try {
        const { fecha } = req.params;
        const stats = await VentaModel.getStatsByDate(fecha);
        res.json({ fecha, ...stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 5. TOTALES DE HOY
const getTotalesHoy = async (req, res) => {
    try {
        const hoy = new Date().toISOString().split('T')[0];
        const stats = await VentaModel.getStatsByDate(hoy);
        res.json({ fecha: hoy, ...stats });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = { 
    crearVenta, getReporteHoy, getReporteFecha, getTotalesFecha, getTotalesHoy 
};