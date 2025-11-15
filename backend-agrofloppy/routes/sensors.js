const express = require('express');
const mqttService = require('../services/mqttService');
const database = require('../services/database');
const { authenticateToken } = require('./auth');

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// @route   GET /api/sensors/current
// @desc    Obtener datos actuales de sensores
// @access  Private
router.get('/current', (req, res) => {
  try {
    const currentState = mqttService.getCurrentState();

    res.json({
      success: true,
      data: {
        connected: currentState.connected,
        sensors: currentState.lastSensorData,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error obteniendo datos actuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo datos de sensores'
    });
  }
});

// @route   GET /api/sensors/history
// @desc    Obtener historial de lecturas de sensores
// @access  Private
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const hours = parseInt(req.query.hours) || 24;

    const [history, stats] = await Promise.all([
      database.getLatestSensorData(limit),
      database.getSensorStats(hours)
    ]);

    res.json({
      success: true,
      data: {
        history: history,
        stats: stats,
        period_hours: hours
      }
    });

  } catch (error) {
    console.error('Error obteniendo historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo historial de sensores'
    });
  }
});

// @route   GET /api/sensors/stats
// @desc    Obtener estadísticas de sensores
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const stats = await database.getSensorStats(hours);

    res.json({
      success: true,
      data: {
        stats: stats,
        period_hours: hours
      }
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estadísticas'
    });
  }
});

// @route   GET /api/sensors/status
// @desc    Obtener estado de conexión MQTT
// @access  Private
router.get('/status', (req, res) => {
  try {
    const status = mqttService.getCurrentState();

    res.json({
      success: true,
      data: {
        mqtt_connected: status.connected,
        last_update: status.lastSensorData.last_update,
        sensors_available: {
          soil_moisture: status.lastSensorData.soil_moisture !== null,
          temperature: status.lastSensorData.temperature !== null,
          humidity: status.lastSensorData.humidity !== null,
          water_level: status.lastSensorData.water_level !== null
        }
      }
    });

  } catch (error) {
    console.error('Error obteniendo estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo estado del sistema'
    });
  }
});

// @route   POST /api/sensors/update
// @desc    Forzar actualización de datos (para testing)
// @access  Private
router.post('/update', async (req, res) => {
  try {
    // Simular recepción de datos MQTT (para testing)
    const testData = {
      soil_moisture: 45.5,
      temperature: 25.3,
      humidity: 65.2,
      water_level: 12.8,
      pump_state: 'OFF',
      pump_mode: 'AUTO'
    };

    await database.saveSensorData(testData);

    res.json({
      success: true,
      message: 'Datos de prueba guardados',
      data: testData
    });

  } catch (error) {
    console.error('Error guardando datos de prueba:', error);
    res.status(500).json({
      success: false,
      message: 'Error guardando datos de prueba'
    });
  }
});

module.exports = router;
