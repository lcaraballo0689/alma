const express = require('express');
const router = express.Router();
const permissionController = require('../controllers/permissionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Ruta para obtener todos los permisos
router.get('/', authMiddleware, permissionController.getAllPermissions);

// Ruta para obtener un permiso por ID
router.get('/:id', authMiddleware, permissionController.getPermissionById);

// Ruta para crear un permiso
router.post('/', authMiddleware, permissionController.createPermission);

// Ruta para actualizar un permiso
router.put('/:id', authMiddleware, permissionController.updatePermission);

// Ruta para eliminar un permiso
router.delete('/:id', authMiddleware, permissionController.deletePermission);

module.exports = router;
