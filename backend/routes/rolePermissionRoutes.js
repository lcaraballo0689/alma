const express = require('express');
const router = express.Router();
const rolePermissionController = require('../controllers/rolePermissionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Asignar un permiso a un rol
router.post('/assign', authMiddleware, rolePermissionController.assignPermission);

// Remover un permiso de un rol
router.post('/remove', authMiddleware, rolePermissionController.removePermission);

// Obtener permisos asignados a un rol (usando el id del rol en la URL)
router.post('/', authMiddleware, rolePermissionController.getPermissionsByRole);

module.exports = router;
