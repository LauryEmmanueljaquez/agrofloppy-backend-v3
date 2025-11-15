const mqtt = require('mqtt');
const config = require('../config');
const database = require('./database');

class MQTTService {
  constructor() {
    this.client = null;
    this.isConnected = false;
    this.lastSensorData = {
      soil_moisture: null,
      temperature: null,
      humidity: null,
      water_level: null,
      pump_state: 'OFF',
      pump_mode: 'AUTO',
      last_update: null
    };
    this.subscribers = [];
  }

  // Conectar al broker MQTT
  connect() {
    console.log('🔄 Conectando a MQTT broker...');

    this.client = mqtt.connect(config.MQTT.BROKER, {
      username: config.MQTT.USERNAME,
      password: config.MQTT.PASSWORD,
      clientId: config.MQTT.CLIENT_ID,
      clean: true,
      reconnectPeriod: config.MQTT.RECONNECT_PERIOD,
      connectTimeout: config.MQTT.CONNECT_TIMEOUT
    });

    // Eventos de conexión
    this.client.on('connect', () => {
      console.log('✅ Conectado a MQTT broker');
      this.isConnected = true;
      this.subscribeToTopics();
      this.notifySubscribers('connected', { connected: true });
    });

    this.client.on('error', (error) => {
      console.error('❌ Error MQTT:', error.message);
      this.isConnected = false;
      this.notifySubscribers('error', { error: error.message });
    });

    this.client.on('offline', () => {
      console.log('⚠️ MQTT desconectado');
      this.isConnected = false;
      this.notifySubscribers('disconnected', { connected: false });
    });

    this.client.on('reconnect', () => {
      console.log('🔄 Reconectando a MQTT...');
    });

    // Manejar mensajes entrantes
    this.client.on('message', (topic, message) => {
      this.handleMessage(topic, message.toString());
    });
  }

  // Suscribirse a tópicos
  subscribeToTopics() {
    const topics = [
      config.TOPICS.SOIL,
      config.TOPICS.TEMPERATURE,
      config.TOPICS.HUMIDITY,
      config.TOPICS.WATER_LEVEL,
      config.TOPICS.STATUS,
      config.TOPICS.ESTADO_BOMBA,
      config.TOPICS.ESTADO_MODO
    ];

    topics.forEach(topic => {
      this.client.subscribe(topic, (err) => {
        if (err) {
          console.error(`❌ Error suscribiéndose a ${topic}:`, err);
        } else {
          console.log(`✅ Suscrito a: ${topic}`);
        }
      });
    });
  }

  // Manejar mensajes MQTT
  async handleMessage(topic, message) {
    console.log(`📨 MQTT [${topic}]: ${message}`);

    try {
      const timestamp = new Date();

      switch (topic) {
        case config.TOPICS.SOIL:
          this.lastSensorData.soil_moisture = parseFloat(message);
          await this.saveSensorData();
          break;

        case config.TOPICS.TEMPERATURE:
          this.lastSensorData.temperature = parseFloat(message);
          break;

        case config.TOPICS.HUMIDITY:
          this.lastSensorData.humidity = parseFloat(message);
          break;

        case config.TOPICS.WATER_LEVEL:
          this.lastSensorData.water_level = parseFloat(message);
          break;

        case config.TOPICS.ESTADO_BOMBA:
          this.lastSensorData.pump_state = message;
          await this.saveSensorData();
          break;

        case config.TOPICS.ESTADO_MODO:
          this.lastSensorData.pump_mode = message;
          await this.saveSensorData();
          break;

        case config.TOPICS.STATUS:
          console.log(`📊 Estado del sistema: ${message}`);
          break;
      }

      this.lastSensorData.last_update = timestamp;
      this.notifySubscribers('sensor_update', this.lastSensorData);

    } catch (error) {
      console.error('❌ Error procesando mensaje MQTT:', error);
    }
  }

  // Guardar datos de sensores en base de datos
  async saveSensorData() {
    try {
      await database.saveSensorData(this.lastSensorData);
      console.log('💾 Datos de sensores guardados en BD');
    } catch (error) {
      console.error('❌ Error guardando datos de sensores:', error);
    }
  }

  // Enviar comando MQTT
  publishCommand(topic, message, qos = 1) {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('MQTT no conectado'));
        return;
      }

      this.client.publish(topic, message, { qos }, (err) => {
        if (err) {
          console.error('❌ Error publicando comando:', err);
          reject(err);
        } else {
          console.log(`📤 Comando enviado [${topic}]: ${message}`);

          // Guardar comando en base de datos
          database.saveCommand(topic.split('/').pop(), message, 'backend')
            .catch(error => console.error('Error guardando comando:', error));

          resolve();
        }
      });
    });
  }

  // Comandos específicos para bomba
  async setPumpState(state) {
    await this.publishCommand(config.TOPICS.CMD_BOMBA, state.toUpperCase());
  }

  async setPumpMode(mode) {
    await this.publishCommand(config.TOPICS.CMD_MODO, mode.toUpperCase());
  }

  // Sistema de suscriptores para notificaciones en tiempo real
  subscribe(callback) {
    this.subscribers.push(callback);
    return () => {
      this.subscribers = this.subscribers.filter(sub => sub !== callback);
    };
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Error en subscriber:', error);
      }
    });
  }

  // Obtener estado actual
  getCurrentState() {
    return {
      connected: this.isConnected,
      lastSensorData: this.lastSensorData
    };
  }

  // Cerrar conexión
  disconnect() {
    if (this.client) {
      this.client.end();
      this.isConnected = false;
      console.log('🔌 MQTT desconectado');
    }
  }
}

// Instancia singleton
const mqttService = new MQTTService();

module.exports = mqttService;
