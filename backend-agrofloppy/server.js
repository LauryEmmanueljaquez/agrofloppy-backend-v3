const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');

const config = require('./config');
const mqttService = require('./services/mqttService');

// Importar rutas
const authRoutes = require('./routes/auth').router;
const sensorRoutes = require('./routes/sensors');
const controlRoutes = require('./routes/control');
const adminRoutes = require('./routes/admin');

// Crear aplicación Express
const app = express();
const server = createServer(app);

// Configurar Socket.IO para tiempo real
const io = new Server(server, {
  cors: {
    origin: config.CORS.ORIGIN,
    credentials: config.CORS.CREDENTIALS
  }
});

// Middleware de seguridad
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.RATE_LIMIT.WINDOW_MS,
  max: config.RATE_LIMIT.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Demasiadas peticiones desde esta IP, por favor intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS
app.use(cors({
  origin: config.CORS.ORIGIN,
  credentials: config.CORS.CREDENTIALS
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path} - IP: ${req.ip}`);
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Agro Floppy API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/sensors', sensorRoutes);
app.use('/api/control', controlRoutes);
app.use('/api/admin', adminRoutes);

// Endpoint de compatibilidad para testing
app.get('/api/metrics', (req, res) => {
  try {
    const currentState = mqttService.getCurrentState();

    // Simular respuesta similar al ESP32 para compatibilidad
    const response = {
      ok: true,
      state: currentState.lastSensorData.pump_state || 'off',
      mode: currentState.lastSensorData.pump_mode || 'auto',
      source: currentState.connected ? 'remote' : 'local',
      humidity_percent: currentState.lastSensorData.soil_moisture || 0,
      temperature: currentState.lastSensorData.temperature || 0,
      humidity_ambient: currentState.lastSensorData.humidity || 0,
      water_level: currentState.lastSensorData.water_level || 0,
      thresholds: {
        on: config.PUMP.DEFAULT_THRESH_ON,
        off: config.PUMP.DEFAULT_THRESH_OFF
      },
      mqtt_enabled: true,
      mqtt_connected: currentState.connected
    };

    res.json(response);
  } catch (error) {
    console.error('Error en /api/metrics:', error);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// Endpoints de compatibilidad con ESP32
app.get('/on', (req, res) => {
  res.json({ ok: true, state: 'on' });
});

app.get('/off', (req, res) => {
  res.json({ ok: true, state: 'off' });
});

app.get('/state', (req, res) => {
  const state = mqttService.getCurrentState();
  res.json({
    ok: true,
    state: (state.lastSensorData.pump_state || 'off').toLowerCase()
  });
});

// Manejo de errores 404
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`
  });
});

// Manejo global de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);

  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined
  });
});

// Configurar Socket.IO para tiempo real
io.on('connection', (socket) => {
  console.log(`🔌 Cliente Socket.IO conectado: ${socket.id}`);

  // Enviar estado inicial
  const initialState = mqttService.getCurrentState();
  socket.emit('initial_state', initialState);

  // Suscribirse a actualizaciones MQTT
  const unsubscribe = mqttService.subscribe((event, data) => {
    socket.emit(event, data);
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log(`🔌 Cliente Socket.IO desconectado: ${socket.id}`);
    unsubscribe();
  });
});

// Función para iniciar servidor
async function startServer() {
  try {
    // Conectar a MQTT
    console.log('🚀 Iniciando Agro Floppy Backend...');
    mqttService.connect();

    // Iniciar servidor HTTP
    server.listen(config.PORT, () => {
      console.log('🌐 Servidor HTTP corriendo en puerto', config.PORT);
      console.log('📡 API disponible en:', `http://localhost:${config.PORT}`);
      console.log('🔗 Socket.IO habilitado para tiempo real');
      console.log('✅ Backend Agro Floppy listo!');
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('  GET  /health - Health check');
      console.log('  POST /api/auth/login - Login');
      console.log('  GET  /api/sensors/current - Datos actuales');
      console.log('  POST /api/control/pump/on - Encender bomba');
      console.log('  POST /api/control/pump/off - Apagar bomba');
      console.log('  POST /api/admin/users - Crear usuario (admin)');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Manejo de señales de terminación
process.on('SIGINT', async () => {
  console.log('\n🛑 Recibida señal SIGINT, cerrando servidor...');

  // Cerrar MQTT
  mqttService.disconnect();

  // Cerrar servidor
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Recibida señal SIGTERM, cerrando servidor...');
  mqttService.disconnect();
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    process.exit(0);
  });
});

// Iniciar servidor si este archivo es ejecutado directamente
if (require.main === module) {
  startServer();
}

module.exports = { app, server, io, startServer };
