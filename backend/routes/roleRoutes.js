// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const rolePermissionController = require('../controllers/rolePermissionController');
const { authMiddleware } = require('../middlewares/authMiddleware');

// Endpoints de roles
router.get('/', authMiddleware, roleController.getAllRoles);
router.get('/:id', authMiddleware, roleController.getRoleById);
router.post('/', authMiddleware, roleController.createRole);
router.put('/:id', authMiddleware, roleController.updateRole);
router.delete('/:id', authMiddleware, roleController.deleteRole);

// Endpoints de asignación de permisos para un rol
router.get('/permissions', authMiddleware, rolePermissionController.getPermissionsByRole);
router.post('/permissions', authMiddleware, rolePermissionController.updatePermissions);
// También pueden dejarse los endpoints "assign" y "remove" si se quieren mantener de forma separada:
// router.post('/assign', authMiddleware, rolePermissionController.assignPermission);
// router.post('/remove', authMiddleware, rolePermissionController.removePermission);

module.exports = router;
