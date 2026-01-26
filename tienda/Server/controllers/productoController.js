const ProductoModel = require('../models/Producto');

// 1. LISTAR TODOS
const getProductos = async (req, res) => {
    try {
        const productos = await ProductoModel.findAll();
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 2. BUSCAR
const searchProductos = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        
        const productos = await ProductoModel.search(q);
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// 3. AGREGAR
const createProducto = async (req, res) => {
    try {
        const { producto, codigo } = req.body;

        // Validar Nombre duplicado
        if (await ProductoModel.checkDuplicate('Producto', producto.trim())) {
            return res.status(400).json({ error: 'Ya existe un producto con ese nombre' });
        }

        // Validar Código duplicado (solo si enviaron código)
        if (codigo && await ProductoModel.checkDuplicate('Codigo', codigo.trim())) {
            return res.status(400).json({ error: 'Ya existe un producto con ese código de barras' });
        }

        const newId = await ProductoModel.create(req.body);
        res.json({ success: true, mensaje: 'Producto agregado', productoId: newId });

    } catch (error) {
        res.status(500).json({ error: 'Error al crear producto' });
    }
};

// 4. EDITAR
const updateProducto = async (req, res) => {
    try {
        const { id } = req.params;
        const { producto, codigo } = req.body;

        // Verificar existencia
        const current = await ProductoModel.findById(id);
        if (!current) return res.status(404).json({ error: 'Producto no encontrado' });

        // Validar duplicados excluyendo el ID actual
        if (await ProductoModel.checkDuplicate('Producto', producto.trim(), id)) {
            return res.status(400).json({ error: 'El nombre ya está en uso por otro producto' });
        }

        if (codigo && await ProductoModel.checkDuplicate('Codigo', codigo.trim(), id)) {
            return res.status(400).json({ error: 'El código ya está en uso por otro producto' });
        }

        await ProductoModel.update(id, req.body);
        res.json({ success: true, mensaje: 'Producto actualizado' });

    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
};

//Editar solo el Stock(alertas)
const actualizarStockRapido = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevoStock } = req.body;

        if (nuevoStock === undefined || nuevoStock < 0) {
            return res.status(400).json({ error: 'Stock inválido' });
        }

        await ProductoModel.updateStock(id, parseInt(nuevoStock));
        res.json({ success: true, message: 'Stock actualizado' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar stock' });
    }
};

// Actualizacion rapida de fecha de caducidad(alertas)
const actualizarCaducidadRapida = async (req, res) => {
    try {
        const { id } = req.params;
        const { nuevaFecha } = req.body; // Esperamos formato YYYY-MM-DD

        if (!nuevaFecha) {
            return res.status(400).json({ error: 'Fecha inválida' });
        }

        await ProductoModel.updateExpiry(id, nuevaFecha);
        res.json({ success: true, message: 'Fecha de caducidad actualizada' });
    } catch (error) {
        res.status(500).json({ error: 'Error al actualizar fecha' });
    }
};

// 5. ELIMINAR
const deleteProducto = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar dependencias (Ventas o Cuentas)
        const dependency = await ProductoModel.hasDependencies(id);
        if (dependency) {
            return res.status(400).json({ 
                error: `No se puede eliminar: El producto tiene ${dependency} registradas.` 
            });
        }

        const success = await ProductoModel.delete(id);
        if (!success) return res.status(404).json({ error: 'Producto no encontrado' });

        res.json({ success: true, mensaje: 'Producto eliminado correctamente' });

    } catch (error) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
};


// --- CONTROLADORES DE ALERTAS ---

const getAlertasStock = async (req, res) => {
    try {
        const productos = await ProductoModel.getLowStock();
        // Enviamos DIRECTO el array para que el frontend no batalle
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener alertas de stock' });
    }
};

const getAlertasCaducidad = async (req, res) => {
    try {
        // Por defecto 30 días, o lo que mandes por ?dias=60
        const dias = req.query.dias || 30;
        const productos = await ProductoModel.getExpiringSoon(dias);
        
        res.json(productos);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener alertas de caducidad' });
    }
};



module.exports = {
    getProductos, 
    searchProductos, 
    createProducto, 
    updateProducto, 
    deleteProducto, 
    getAlertasCaducidad, 
    getAlertasStock,
    actualizarStockRapido,
    actualizarCaducidadRapida
};