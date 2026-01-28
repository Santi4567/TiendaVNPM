// src/controllers/ventaLibroController.js

const VentaLibroModel = require('../models/VentaLibro');
const UsuarioModel = require('../models/Usuario');
const { getDB } = require('../config/database');

const crearVenta = async (req, res) => {
    try {
        const { productos, cliente, total, pagoInicial } = req.body;
        const userId = req.user.userId;

        // --- CORRECCIÓN DE TIPOS (BLINDAJE) ---
        const totalNum = parseFloat(total);
        const pagoNum = parseFloat(pagoInicial);

        // Validamos que sean números válidos para evitar NaN
        if (isNaN(totalNum) || isNaN(pagoNum)) {
            return res.status(400).json({ error: 'Datos de montos inválidos' });
        }

        // Lógica precisa: Si paga MENOS del total (con un margen de error mínimo por decimales), es Apartado
        // Usamos una pequeña epsilon (0.01) para evitar errores de punto flotante
        const esApartado = pagoNum < (totalNum - 0.01); 
        
        // Validación de Cliente Obligatorio para Apartados
        if (esApartado && (!cliente || !cliente.ID)) {
            return res.status(400).json({ error: 'Para apartar es OBLIGATORIO seleccionar un Cliente.' });
        }

        const vendedor = await UsuarioModel.findById(userId);
        
        // Obtener Nombre Cliente
        let clienteNombre = null;
        let clienteId = null;
        if (cliente && cliente.ID) {
            const db = getDB();
            const [rows] = await db.execute('SELECT Nombre FROM clientes WHERE ID = ?', [cliente.ID]);
            if (rows.length > 0) {
                clienteNombre = rows[0].Nombre;
                clienteId = cliente.ID;
            }
        }

        // Definir valores finales
        const montoPagadoFinal = esApartado ? pagoNum : totalNum;
        const estadoVenta = esApartado ? 'PENDIENTE' : 'PAGADO'; // PENDIENTE = Apartado

        const ventaId = await VentaLibroModel.create({
            items: productos,
            idUsuario: userId,
            usuarioNombre: vendedor.Nombre_Completo || vendedor.Usuario,
            idCliente: clienteId,
            clienteNombre: clienteNombre || 'Público General',
            total: totalNum,
            pagado: montoPagadoFinal, // Guardamos el abono real
            estado: estadoVenta       // Guardamos el estado correcto
        });

        res.json({ success: true, message: esApartado ? 'Apartado registrado' : 'Venta completada', id: ventaId });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};

const getHistorial = async (req, res) => {
    try {
        const ventas = await VentaLibroModel.findAll();
        res.json(ventas);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const getDetallesVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const detalles = await VentaLibroModel.getDetalle(id);
        res.json(detalles);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

//abonar dinero de un apartado
const abonarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const { monto } = req.body;
        const userId = req.user.userId;

        // Buscar nombre del cajero
        const cajero = await UsuarioModel.findById(userId);
        const nombreCajero = cajero.Nombre_Completo || cajero.Usuario;
        
        if (!monto || monto <= 0) return res.status(400).json({ error: 'Monto inválido' });

        // Llamar al modelo con los datos del usuario
        const result = await VentaLibroModel.addAbono(id, parseFloat(monto), userId, nombreCajero);
        
        res.json({ 
            success: true, 
            message: result.liquidado ? '¡Deuda liquidada completamente!' : 'Abono registrado correctamente',
            liquidado: result.liquidado
        });
    } catch (error) { 
        // Si el modelo lanza error de validación (monto excede), lo cachamos aquí
        res.status(400).json({ error: error.message }); 
    }
};

// Traer todos los abonos 
const getAbonosVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const abonos = await VentaLibroModel.getAbonos(id);
        res.json(abonos);
    } catch (error) { res.status(500).json({ error: error.message }); }
};

const cancelarVenta = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.userId;
        // Aquí podrías buscar el nombre del usuario si quieres guardarlo en un log de auditoría
        
        await VentaLibroModel.cancel(id, userId, 'Admin'); // Simplificado
        
        res.json({ success: true, message: 'Venta cancelada y stock restaurado' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
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

module.exports = { crearVenta, getHistorial, getDetallesVenta, abonarVenta, getAbonosVenta, cancelarVenta,getHistorialGlobal };
