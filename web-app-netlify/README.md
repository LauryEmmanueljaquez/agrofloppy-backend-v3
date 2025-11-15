# 🌾 Agro Floppy - Sistema de Riego Inteligente

Aplicación web en tiempo real para controlar y monitorear tu sistema de riego desde cualquier lugar del mundo.

## ✨ Características

- 🔐 **Login seguro** (usuario demo)
- 📊 **Dashboard en tiempo real** con datos de sensores
- 🎮 **Control remoto** de bomba y modo de operación
- 📱 **Diseño responsive** (funciona en móviles y PC)
- 🌐 **Conexión MQTT** por WebSocket (HiveMQ Cloud)
- 📜 **Registro de eventos** en tiempo real

## 🚀 Desplegar en Netlify (GRATIS)

### **Método 1: Arrastrar y Soltar (Más Fácil)**

1. Ve a [Netlify](https://www.netlify.com/)
2. Crea una cuenta gratuita (o inicia sesión)
3. En el dashboard, arrastra la carpeta `web-app-netlify` completa
4. ¡Listo! Netlify te dará una URL tipo: `tu-app.netlify.app`

### **Método 2: Desde GitHub**

1. Sube esta carpeta a un repositorio de GitHub
2. Ve a [Netlify](https://www.netlify.com/)
3. Click en "New site from Git"
4. Conecta tu cuenta de GitHub
5. Selecciona el repositorio
6. Click en "Deploy site"

### **Método 3: Netlify CLI**

```bash
# Instalar Netlify CLI
npm install -g netlify-cli

# Ir a la carpeta
cd web-app-netlify

# Iniciar sesión
netlify login

# Desplegar
netlify deploy --prod
```

## 📱 Acceder a la App

Una vez desplegada, tu app estará disponible en:
```
https://tu-app.netlify.app
```

**Credenciales de acceso:**
- Usuario: `demo`
- Contraseña: `demo123`

## 🔧 Configuración

### **Cambiar Credenciales de Login**

Edita `index.html` línea 54-60:

```javascript
// Cambiar estas credenciales
if (username === 'demo' && password === 'demo123') {
    // ... código ...
}
```

### **Cambiar Broker MQTT**

Edita `app.js` líneas 2-7:

```javascript
const MQTT_CONFIG = {
    broker: 'wss://8e0a142960e8450782851aa152d68bcf.s1.eu.hivemq.cloud:8884/mqtt',
    username: 'Actuana',
    password: 'Actuana12345678',
    clientId: 'webapp-' + Math.random().toString(16).substr(2, 8)
};
```

### **Cambiar Tópicos MQTT**

Edita `app.js` líneas 10-27 si necesitas cambiar los tópicos.

## 📊 Datos que se Muestran

1. **💧 Humedad del Suelo** - Porcentaje 0-100%
2. **🌡️ Temperatura** - Grados Celsius
3. **💨 Humedad Ambiental** - Porcentaje 0-100%
4. **📏 Nivel de Agua** - Centímetros

## 🎮 Controles Disponibles

- **Encender/Apagar Bomba** (solo en modo manual)
- **Cambiar a Modo Automático**
- **Cambiar a Modo Manual**
- **Ver estado en tiempo real**
- **Registro de eventos**

## 🔒 Seguridad

### **Nivel Actual:**
- ✅ Login básico (usuario/contraseña)
- ✅ Sesión temporal
- ✅ Conexión MQTT con autenticación
- ✅ HTTPS automático por Netlify

### **Mejoras Recomendadas:**
Para uso en producción, considera:
- Implementar autenticación con JWT
- Base de datos para usuarios
- Rate limiting
- Logging de accesos

## 🌐 Compatibilidad

- ✅ Chrome/Edge (recomendado)
- ✅ Firefox
- ✅ Safari
- ✅ Móviles iOS/Android

## 📱 Personalizar Dominio

En Netlify, puedes configurar tu propio dominio:

1. Ve a "Domain settings"
2. Click en "Add custom domain"
3. Sigue las instrucciones

## 🐛 Solución de Problemas

### **No conecta a MQTT:**
- Verifica que HiveMQ Cloud esté activo
- Revisa credenciales en `app.js`
- Verifica que los ESP32 estén encendidos

### **No carga la página:**
- Verifica que subiste todos los archivos
- Revisa la consola del navegador (F12)
- Asegúrate que Netlify desplegó correctamente

### **Botones no funcionan:**
- Verifica conexión MQTT (debe estar verde)
- Revisa el registro de eventos
- Asegúrate que estés en modo correcto (AUTO/MANUAL)

## 📂 Estructura de Archivos

```
web-app-netlify/
├── index.html          # Página de login
├── dashboard.html      # Dashboard principal
├── app.js             # Lógica MQTT y controles
├── styles.css         # Estilos
├── netlify.toml       # Configuración Netlify
└── README.md          # Este archivo
```

## 🔄 Actualizar la App

Para actualizar después de hacer cambios:

1. **Si usaste arrastrar y soltar:**
   - Vuelve a arrastrar la carpeta actualizada

2. **Si usaste GitHub:**
   - Haz commit y push de los cambios
   - Netlify desplegará automáticamente

3. **Si usaste CLI:**
   ```bash
   netlify deploy --prod
   ```

## 🌟 Características Avanzadas

### **Agregar más usuarios:**
Edita `index.html` y agrega más validaciones:

```javascript
const users = {
    'demo': 'demo123',
    'admin': 'admin456',
    'karen': 'mi_password'
};

if (users[username] === password) {
    // Login exitoso
}
```

### **Agregar notificaciones:**
Agrega al `app.js`:

```javascript
function sendNotification(message) {
    if (Notification.permission === "granted") {
        new Notification("Sistema de Riego", {
            body: message,
            icon: "🌱"
        });
    }
}
```

## 📞 Soporte

Para problemas o preguntas:
1. Revisa la consola del navegador (F12)
2. Verifica el registro de eventos en el dashboard
3. Revisa que los ESP32 estén conectados

## 📝 Licencia

Proyecto Agro Floppy - Sistema de Riego Inteligente © 2024

---

## 🎯 Resumen Rápido

1. Sube carpeta a Netlify
2. Obtienes URL: `tu-app.netlify.app`
3. Login: demo / demo123
4. ¡Controla tu sistema desde cualquier lugar! 🌍

**¡Tu sistema de riego ahora tiene una app web profesional!** 🚀

