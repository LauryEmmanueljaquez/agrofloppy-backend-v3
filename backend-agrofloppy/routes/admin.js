const express = require('express');
const { body, validationResult } = require('express-validator');
const database = require('../services/database');
const { authenticateToken, requireAdmin } = require('./auth');

const router = express.Router();

// Aplicar autenticación y verificación de admin a todas las rutas
router.use(authenticateToken);
router.use(requireAdmin);

// @route   GET /api/admin/users
// @desc    Listar todos los usuarios
// @access  Private (Admin only)
router.get('/users', async (req, res) => {
  try {
    const users = await database.getAllUsers();

    res.json({
      success: true,
      count: users.length,
      users: users
    });

  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo lista de usuarios'
    });
  }
});

// @route   POST /api/admin/users
// @desc    Crear nuevo usuario
// @access  Private (Admin only)
router.post('/users', [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Usuario debe tener entre 3-50 caracteres')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Usuario solo puede contener letras, números y guiones bajos'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Contraseña debe tener al menos 6 caracteres'),
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2-100 caracteres'),
  body('role')
    .isIn(['user', 'admin'])
    .withMessage('Rol debe ser "user" o "admin"')
], async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const { username, password, name, role } = req.body;

    // Verificar que el usuario no exista
    const existingUser = await database.getUserByUsername(username);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    // Crear usuario
    const newUser = await database.createUser(username, password, name, role);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      user: {
        id: newUser.id,
        username: newUser.username,
        name: newUser.name,
        role: newUser.role
      }
    });

  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando usuario'
    });
  }
});

// @route   PUT /api/admin/users/:id
// @desc    Actualizar usuario
// @access  Private (Admin only)
router.put('/users/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Nombre debe tener entre 2-100 caracteres'),
  body('role')
    .optional()
    .isIn(['user', 'admin'])
    .withMessage('Rol debe ser "user" o "admin"')
], async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const updates = {};
    if (req.body.name) updates.name = req.body.name;
    if (req.body.role) updates.role = req.body.role;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    // Verificar que no se pueda cambiar el rol de usuarios por defecto (ID 1 y 2)
    if ((userId === 1 || userId === 2) && updates.role && updates.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No se puede cambiar el rol de usuarios por defecto'
      });
    }

    // Verificar que el usuario actual no se quite su propio rol de admin
    if (userId === req.user.id && updates.role === 'user') {
      return res.status(403).json({
        success: false,
        message: 'No puedes quitarte el rol de administrador a ti mismo'
      });
    }

    await database.updateUser(userId, updates);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error actualizando usuario:', error);

    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error actualizando usuario'
    });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Eliminar usuario
// @access  Private (Admin only)
router.delete('/users/:id', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);

    // No permitir eliminar usuarios por defecto
    if (userId === 1 || userId === 2) {
      return res.status(403).json({
        success: false,
        message: 'No se pueden eliminar usuarios por defecto'
      });
    }

    // No permitir que un usuario se elimine a sí mismo
    if (userId === req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No puedes eliminarte a ti mismo'
      });
    }

    await database.deleteUser(userId);

    res.json({
      success: true,
      message: 'Usuario eliminado exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando usuario:', error);

    if (error.message === 'No se pueden eliminar usuarios por defecto') {
      return res.status(403).json({
        success: false,
        message: error.message
      });
    }

    if (error.message === 'Usuario no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error eliminando usuario'
    });
  }
});

// @route   GET /api/admin/stats
// @desc    Obtener estadísticas del sistema
// @access  Private (Admin only)
router.get('/stats', async (req, res) => {
  try {
    const stats = await database.getSystemStats();

    res.json({
      success: true,
      stats: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas del sistema'
    });
  }
});

module.exports = router;
