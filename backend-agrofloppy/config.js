// Configuración del Backend Agro Floppy
const config = {
  // Puerto del servidor
  PORT: process.env.PORT || 3000,

  // Base de datos
  DATABASE: {
    FILE: './database/agrofloppy.db'
  },

  // JWT
  JWT: {
    SECRET: process.env.JWT_SECRET || 'agrofloppy_jwt_secret_2024_super_secure',
    EXPIRES_IN: '24h'
  },

  // MQTT Broker Configuration
  MQTT: {
    BROKER: 'wss://8e0a142960e8450782851aa152d68bcf.s1.eu.hivemq.cloud:8884/mqtt',
    USERNAME: 'Actuana',
    PASSWORD: 'Actuana12345678',
    CLIENT_ID: 'backend-agrofloppy-' + Math.random().toString(16).substr(2, 8),
    RECONNECT_PERIOD: 5000,
    CONNECT_TIMEOUT: 30000
  },

  // Tópicos MQTT
  TOPICS: {
    // Datos de sensores
    SOIL: 'karen2024/riego/suelo',
    TEMPERATURE: 'karen2024/riego/temperatura',
    HUMIDITY: 'karen2024/riego/humedad',
    WATER_LEVEL: 'karen2024/riego/nivel_agua',
    STATUS: 'karen2024/riego/estado',

    // Comandos de control
    CMD_BOMBA: 'karen2024/riego/comando/bomba',
    CMD_MODO: 'karen2024/riego/comando/modo',

    // Estados
    ESTADO_BOMBA: 'karen2024/riego/estado/bomba',
    ESTADO_MODO: 'karen2024/riego/estado/modo'
  },

  // CORS
  CORS: {
    ORIGIN: [
      'http://localhost:3000',
      'http://localhost:5500',
      'http://127.0.0.1:5500',
      'https://agrofloppy-backend.onrender.com',
      'https://*.netlify.app',
      'https://*.netlify.com'
    ],
    CREDENTIALS: true
  },

  // Rate Limiting
  RATE_LIMIT: {
    WINDOW_MS: 15 * 60 * 1000, // 15 minutos
    MAX_REQUESTS: 100 // máximo 100 requests por ventana
  },

  // Usuarios por defecto
  DEFAULT_USERS: [
    {
      username: 'demo',
      password: 'demo123',
      name: 'Usuario Demo',
      role: 'user'
    },
    {
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      role: 'admin'
    }
  ],

  // Configuración de sensores
  SENSORS: {
    TIMEOUT_MS: 15000, // 15 segundos sin datos remotos
    UPDATE_INTERVAL_MS: 2000 // Actualizar cada 2 segundos
  },

  // Configuración de bomba
  PUMP: {
    DEFAULT_THRESH_ON: 35,  // Encender si humedad < 35%
    DEFAULT_THRESH_OFF: 45  // Apagar si humedad > 45%
  }
};

module.exports = config;
