const express = require('express');
const { body, validationResult } = require('express-validator');
const mqttService = require('../services/mqttService');
const database = require('../services/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// @route   POST /api/control/pump/on
// @desc    Encender bomba
// @access  Private
router.post('/pump/on', async (req, res) => {
  try {
    await mqttService.setPumpState('ON');

    // Guardar comando en BD
    await database.saveCommand('pump_control', 'ON', req.user.username);

    res.json({
      success: true,
      message: 'Bomba encendida exitosamente',
      command: 'ON',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error encendiendo bomba:', error);
    res.status(500).json({
      success: false,
      message: 'Error encendiendo la bomba',
      error: error.message
    });
  }
});

// @route   POST /api/control/pump/off
// @desc    Apagar bomba
// @access  Private
router.post('/pump/off', async (req, res) => {
  try {
    await mqttService.setPumpState('OFF');

    // Guardar comando en BD
    await database.saveCommand('pump_control', 'OFF', req.user.username);

    res.json({
      success: true,
      message: 'Bomba apagada exitosamente',
      command: 'OFF',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error apagando bomba:', error);
    res.status(500).json({
      success: false,
      message: 'Error apagando la bomba',
      error: error.message
    });
  }
});

// @route   POST /api/control/mode/auto
// @desc    Cambiar a modo automático
// @access  Private
router.post('/mode/auto', async (req, res) => {
  try {
    await mqttService.setPumpMode('AUTO');

    // Guardar comando en BD
    await database.saveCommand('mode_change', 'AUTO', req.user.username);

    res.json({
      success: true,
      message: 'Modo cambiado a automático',
      mode: 'AUTO',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cambiando a modo automático:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando modo',
      error: error.message
    });
  }
});

// @route   POST /api/control/mode/manual
// @desc    Cambiar a modo manual
// @access  Private
router.post('/mode/manual', async (req, res) => {
  try {
    await mqttService.setPumpMode('MANUAL');

    // Guardar comando en BD
    await database.saveCommand('mode_change', 'MANUAL', req.user.username);

    res.json({
      success: true,
      message: 'Modo cambiado a manual',
      mode: 'MANUAL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cambiando a modo manual:', error);
    res.status(500).json({
      success: false,
      message: 'Error cambiando modo',
      error: error.message
    });
  }
});

// @route   GET /api/control/status
// @desc    Obtener estado actual de la bomba
// @access  Private
router.get('/status', (req, res) => {
  try {
    const currentState = mqttService.getCurrentState();

    res.json({
      success: true,
      data: {
        pump_state: currentState.lastSensorData.pump_state,
        pump_mode: currentState.lastSensorData.pump_mode,
        mqtt_connected: currentState.connected,
        last_update: currentState.lastSensorData.last_update
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado de bomba:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado de la bomba'
    });
  }
});

// @route   GET /api/control/history
// @desc    Obtener historial de comandos
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const history = await database.getCommandHistory(limit);

    res.json({
      success: true,
      data: {
        history: history,
        count: history.length
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial de comandos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de comandos'
    });
  }
});

// @route   POST /api/control/threshold
// @desc    Cambiar umbrales de riego automático
// @access  Private
router.post('/threshold', [
  body('on_threshold').isInt({ min: 10, max: 80 }).withMessage('Umbral de encendido debe ser entre 10-80'),
  body('off_threshold').isInt({ min: 10, max: 80 }).withMessage('Umbral de apagado debe ser entre 10-80')
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

    const { on_threshold, off_threshold } = req.body;

    // Validar lógica: off_threshold debe ser mayor que on_threshold
    if (off_threshold <= on_threshold) {
      return res.status(400).json({
        success: false,
        message: 'El umbral de apagado debe ser mayor que el de encendido'
      });
    }

    // Aquí podríamos enviar comandos MQTT para cambiar umbrales en el ESP32
    // Por ahora solo guardamos en BD
    await database.saveCommand('threshold_change',
      `ON:${on_threshold},OFF:${off_threshold}`,
      req.user.username);

    res.json({
      success: true,
      message: 'Umbrales actualizados exitosamente',
      thresholds: {
        on: on_threshold,
        off: off_threshold
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error cambiando umbrales:', error);
    res.status(500).json({
      success: false,
      message: 'Error actualizando umbrales',
      error: error.message
    });
  }
});

module.exports = router;
