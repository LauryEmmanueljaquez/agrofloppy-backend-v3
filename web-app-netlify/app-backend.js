// Configuración del Backend API
const API_CONFIG = {
    baseURL: 'https://agrofloppy-backend.onrender.com/api',
    timeout: 10000
};

// Variables globales
let authToken = localStorage.getItem('authToken');
let userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
let updateInterval = null;
let socketConnection = null;

// Verificar autenticación al cargar
function checkAuth() {
    if (!authToken || !userInfo) {
        window.location.href = 'index.html';
        return false;
    }

    // Mostrar información del usuario
    document.getElementById('usernameDisplay').textContent = userInfo.name || userInfo.username;

    // Mostrar botón de admin si es administrador
    if (userInfo.role === 'admin') {
        document.getElementById('adminBtn').style.display = 'inline-block';
    }

    return true;
}

// Función helper para hacer peticiones API
async function apiRequest(endpoint, options = {}) {
    const url = `${API_CONFIG.baseURL}${endpoint}`;
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers
        },
        ...options
    };

    // Agregar token de autenticación si existe
    if (authToken) {
        config.headers.Authorization = `Bearer ${authToken}`;
    }

    // Agregar timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.timeout);
    config.signal = controller.signal;

    try {
        const response = await fetch(url, config);
        clearTimeout(timeoutId);

        const data = await response.json();

        if (!response.ok) {
            // Si es error de autenticación, redirigir al login
            if (response.status === 401 || response.status === 403) {
                logout();
                throw new Error('Sesión expirada. Redirigiendo al login...');
            }
            throw new Error(data.message || `Error ${response.status}`);
        }

        return data;
    } catch (error) {
        clearTimeout(timeoutId);

        if (error.name === 'AbortError') {
            throw new Error('Tiempo de espera agotado');
        }

        throw error;
    }
}

// Actualizar datos de sensores
async function updateSensorData() {
    try {
        const response = await apiRequest('/sensors/current');

        if (response.success) {
            const data = response.data;

            // Actualizar valores de sensores
            updateSensorValue('soilHumidity', data.sensors.soil_moisture, 'soilProgress', 0, 100);
            updateSensorValue('temperature', data.sensors.temperature, 'tempProgress', 0, 50);
            updateSensorValue('humidity', data.sensors.humidity, 'humProgress', 0, 100);
            updateSensorValue('waterLevel', data.sensors.water_level, 'waterProgress', 0, 30);

            // Actualizar estados
            updateBombaEstado(data.sensors.pump_state || 'OFF');
            updateModoEstado(data.sensors.pump_mode || 'AUTO');

            // Actualizar estado del sistema
            updateSystemStatus(data.connected);

            // Actualizar timestamp
            updateLastUpdateTime(data.sensors.last_update);

            addLog('Datos actualizados correctamente', 'success');
        }
    } catch (error) {
        console.error('Error actualizando datos:', error);
        addLog(`Error: ${error.message}`, 'error');
        updateSystemStatus(false);
    }
}

// Actualizar valor de sensor
function updateSensorValue(elementId, value, progressId, min, max) {
    const element = document.getElementById(elementId);
    const progressElement = document.getElementById(progressId);

    if (element && value !== null && value !== undefined) {
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
        const state = (estado || 'OFF').toUpperCase();
        badge.textContent = state;
        badge.className = 'badge ' + (state === 'ON' ? 'badge-on' : 'badge-off');
    }
}

// Actualizar modo de operación
function updateModoEstado(modo) {
    const badge = document.getElementById('modoEstado');
    if (badge) {
        const mode = (modo || 'AUTO').toUpperCase();
        badge.textContent = mode;
        badge.className = 'badge ' + (mode === 'AUTO' ? 'badge-auto' : 'badge-manual');
    }
}

// Actualizar estado del sistema
function updateSystemStatus(connected) {
    const statusElement = document.getElementById('systemStatus');
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
function updateLastUpdateTime(timestamp) {
    const element = document.getElementById('lastUpdate');
    if (element) {
        if (timestamp) {
            const date = new Date(timestamp);
            element.textContent = date.toLocaleTimeString('es-ES');
        } else {
            element.textContent = new Date().toLocaleTimeString('es-ES');
        }
    }
}

// Agregar entrada al log
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

// Enviar comando a la bomba
async function sendPumpCommand(command) {
    try {
        const endpoint = command === 'ON' ? '/control/pump/on' : '/control/pump/off';
        const response = await apiRequest(endpoint, { method: 'POST' });

        if (response.success) {
            addLog(`Bomba ${command.toLowerCase()} exitosamente`, 'success');
            // Actualizar datos inmediatamente
            setTimeout(updateSensorData, 500);
        }
    } catch (error) {
        addLog(`Error ${command.toLowerCase()} bomba: ${error.message}`, 'error');
    }
}

// Cambiar modo de operación
async function sendModeCommand(mode) {
    try {
        const endpoint = mode === 'AUTO' ? '/control/mode/auto' : '/control/mode/manual';
        const response = await apiRequest(endpoint, { method: 'POST' });

        if (response.success) {
            addLog(`Modo cambiado a ${mode.toLowerCase()}`, 'success');
            // Actualizar datos inmediatamente
            setTimeout(updateSensorData, 500);
        }
    } catch (error) {
        addLog(`Error cambiando modo: ${error.message}`, 'error');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    authToken = null;
    userInfo = null;

    if (updateInterval) {
        clearInterval(updateInterval);
    }

    if (socketConnection) {
        socketConnection.disconnect();
    }

    window.location.href = 'index.html';
}

// Inicializar aplicación
document.addEventListener('DOMContentLoaded', function() {
    if (!checkAuth()) return;

    addLog('Iniciando dashboard...', 'info');

    // Event listeners
    document.getElementById('logoutBtn').addEventListener('click', logout);
    document.getElementById('adminBtn').addEventListener('click', () => {
        window.location.href = 'admin.html';
    });

    // Controles de bomba
    document.getElementById('btnBombaOn').addEventListener('click', () => sendPumpCommand('ON'));
    document.getElementById('btnBombaOff').addEventListener('click', () => sendPumpCommand('OFF'));

    // Controles de modo
    document.getElementById('btnModoAuto').addEventListener('click', () => sendModeCommand('AUTO'));
    document.getElementById('btnModoManual').addEventListener('click', () => sendModeCommand('MANUAL'));

    // Limpiar logs
    document.getElementById('btnClearLogs').addEventListener('click', clearLogs);

    // Primera actualización
    updateSensorData();

    // Actualizar cada 3 segundos
    updateInterval = setInterval(updateSensorData, 3000);

    addLog('Dashboard inicializado correctamente', 'success');
});

// Manejar errores no capturados
window.addEventListener('unhandledrejection', function(event) {
    console.error('Error no manejado:', event.reason);
    addLog(`Error no manejado: ${event.reason}`, 'error');
});

window.addEventListener('error', function(event) {
    console.error('Error de JavaScript:', event.error);
    addLog(`Error de JavaScript: ${event.error.message}`, 'error');
});
