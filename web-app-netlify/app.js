// Configuración MQTT para HiveMQ Cloud - Agro Floppy
const MQTT_CONFIG = {
    broker: 'wss://8e0a142960e8450782851aa152d68bcf.s1.eu.hivemq.cloud:8884/mqtt',
    username: 'Actuana',
    password: 'Actuana12345678',
    clientId: 'agrofloppy-' + Math.random().toString(16).substr(2, 8)
};

// Tópicos MQTT
const TOPICS = {
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
};

let mqttClient = null;
let lastUpdate = new Date();

// Verificar autenticación
function checkAuth() {
    if (!sessionStorage.getItem('authenticated')) {
        window.location.href = 'index.html';
        return false;
    }
    return true;
}

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;
    
    // Mostrar nombre de usuario
    const username = sessionStorage.getItem('username') || 'Demo';
    document.getElementById('usernameDisplay').textContent = username;
    
    // Conectar MQTT
    connectMQTT();
    
    // Event Listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('btnBombaOn').addEventListener('click', () => sendCommand(TOPICS.CMD_BOMBA, 'ON'));
    document.getElementById('btnBombaOff').addEventListener('click', () => sendCommand(TOPICS.CMD_BOMBA, 'OFF'));
    document.getElementById('btnModoAuto').addEventListener('click', () => sendCommand(TOPICS.CMD_MODO, 'AUTO'));
    document.getElementById('btnModoManual').addEventListener('click', () => sendCommand(TOPICS.CMD_MODO, 'MANUAL'));
    document.getElementById('btnClearLogs').addEventListener('click', clearLogs);
});

// Conectar a MQTT
function connectMQTT() {
    addLog('Conectando a HiveMQ Cloud...', 'info');
    
    try {
        mqttClient = mqtt.connect(MQTT_CONFIG.broker, {
            username: MQTT_CONFIG.username,
            password: MQTT_CONFIG.password,
            clientId: MQTT_CONFIG.clientId,
            clean: true,
            reconnectPeriod: 5000,
            connectTimeout: 30000
        });
        
        mqttClient.on('connect', onConnect);
        mqttClient.on('message', onMessage);
        mqttClient.on('error', onError);
        mqttClient.on('offline', onOffline);
        mqttClient.on('reconnect', onReconnect);
        
    } catch (error) {
        console.error('Error conectando MQTT:', error);
        addLog('Error: ' + error.message, 'error');
        updateMQTTStatus(false);
    }
}

// Al conectar
function onConnect() {
    console.log('Conectado a MQTT');
    addLog('✓ Conectado a HiveMQ Cloud', 'success');
    updateMQTTStatus(true);
    
    // Suscribirse a todos los tópicos
    const topics = [
        TOPICS.SOIL,
        TOPICS.TEMPERATURE,
        TOPICS.HUMIDITY,
        TOPICS.WATER_LEVEL,
        TOPICS.STATUS,
        TOPICS.ESTADO_BOMBA,
        TOPICS.ESTADO_MODO
    ];
    
    topics.forEach(topic => {
        mqttClient.subscribe(topic, (err) => {
            if (!err) {
                console.log('Suscrito a:', topic);
            }
        });
    });
    
    addLog('Suscrito a todos los tópicos', 'info');
}

// Al recibir mensaje
function onMessage(topic, message) {
    const value = message.toString();
    console.log(`Mensaje recibido - ${topic}: ${value}`);
    
    lastUpdate = new Date();
    updateLastUpdateTime();
    
    // Procesar según el tópico
    switch(topic) {
        case TOPICS.SOIL:
            updateSensorValue('soilHumidity', value, 'soilProgress', 0, 100);
            addLog(`Humedad suelo: ${value}%`, 'data');
            break;
            
        case TOPICS.TEMPERATURE:
            updateSensorValue('temperature', value, 'tempProgress', 0, 50);
            addLog(`Temperatura: ${value}°C`, 'data');
            break;
            
        case TOPICS.HUMIDITY:
            updateSensorValue('humidity', value, 'humProgress', 0, 100);
            addLog(`Humedad ambiental: ${value}%`, 'data');
            break;
            
        case TOPICS.WATER_LEVEL:
            updateSensorValue('waterLevel', value, 'waterProgress', 0, 30);
            addLog(`Nivel agua: ${value}cm`, 'data');
            break;
            
        case TOPICS.ESTADO_BOMBA:
            updateBombaEstado(value);
            break;
            
        case TOPICS.ESTADO_MODO:
            updateModoEstado(value);
            break;
            
        case TOPICS.STATUS:
            addLog(`Estado sistema: ${value}`, 'info');
            break;
    }
}

// Actualizar valor de sensor
function updateSensorValue(elementId, value, progressId, min, max) {
    const element = document.getElementById(elementId);
    const progressElement = document.getElementById(progressId);
    
    if (element) {
        const numValue = parseFloat(value);
        element.textContent = numValue.toFixed(1);
        
        // Actualizar barra de progreso
        if (progressElement) {
            const percentage = ((numValue - min) / (max - min)) * 100;
            progressElement.style.width = Math.min(100, Math.max(0, percentage)) + '%';
        }
    }
}

// Actualizar estado de bomba
function updateBombaEstado(estado) {
    const badge = document.getElementById('bombaEstado');
    if (badge) {
        badge.textContent = estado;
        badge.className = 'badge ' + (estado === 'ON' ? 'badge-on' : 'badge-off');
    }
    addLog(`Bomba: ${estado}`, estado === 'ON' ? 'success' : 'warning');
}

// Actualizar modo de operación
function updateModoEstado(modo) {
    const badge = document.getElementById('modoEstado');
    if (badge) {
        badge.textContent = modo;
        badge.className = 'badge ' + (modo === 'AUTO' ? 'badge-auto' : 'badge-manual');
    }
    addLog(`Modo: ${modo}`, 'info');
}

// Enviar comando
function sendCommand(topic, command) {
    if (!mqttClient || !mqttClient.connected) {
        addLog('Error: No conectado a MQTT', 'error');
        alert('No estás conectado al servidor MQTT');
        return;
    }
    
    mqttClient.publish(topic, command, { qos: 1 }, (err) => {
        if (err) {
            console.error('Error enviando comando:', err);
            addLog(`✗ Error enviando ${command}`, 'error');
        } else {
            console.log(`Comando enviado: ${command} a ${topic}`);
            addLog(`✓ Comando enviado: ${command}`, 'success');
        }
    });
}

// Error MQTT
function onError(error) {
    console.error('Error MQTT:', error);
    addLog('Error: ' + error.message, 'error');
    updateMQTTStatus(false);
}

// Desconectado
function onOffline() {
    console.log('MQTT offline');
    addLog('Desconectado de MQTT', 'warning');
    updateMQTTStatus(false);
}

// Reconectando
function onReconnect() {
    console.log('Reconectando MQTT...');
    addLog('Reconectando...', 'info');
}

// Actualizar estado de conexión MQTT
function updateMQTTStatus(connected) {
    const statusElement = document.getElementById('mqttStatus');
    if (statusElement) {
        if (connected) {
            statusElement.textContent = '🟢 Conectado';
            statusElement.className = 'status-value status-connected';
        } else {
            statusElement.textContent = '🔴 Desconectado';
            statusElement.className = 'status-value status-disconnected';
        }
    }
}

// Actualizar tiempo de última actualización
function updateLastUpdateTime() {
    const element = document.getElementById('lastUpdate');
    if (element) {
        element.textContent = lastUpdate.toLocaleTimeString('es-ES');
    }
}

// Agregar log
function addLog(message, type = 'info') {
    const container = document.getElementById('logsContainer');
    if (!container) return;
    
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry log-' + type;
    
    const timestamp = new Date().toLocaleTimeString('es-ES');
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    container.insertBefore(logEntry, container.firstChild);
    
    // Limitar a 50 logs
    while (container.children.length > 50) {
        container.removeChild(container.lastChild);
    }
}

// Limpiar logs
function clearLogs() {
    const container = document.getElementById('logsContainer');
    if (container) {
        container.innerHTML = '<div class="log-entry">Logs limpiados</div>';
    }
}

// Cerrar sesión
function logout() {
    if (mqttClient) {
        mqttClient.end();
    }
    sessionStorage.clear();
    window.location.href = 'index.html';
}

// Actualizar tiempo cada segundo
setInterval(updateLastUpdateTime, 1000);

