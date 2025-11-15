# 🚀 Guía Paso a Paso para Subir a Netlify

## 📋 Lo que Necesitas

- ✅ Una cuenta de correo (Gmail, Outlook, etc.)
- ✅ La carpeta `web-app-netlify` completa
- ✅ Navegador web (Chrome, Firefox, Edge, etc.)

**Tiempo estimado: 5 minutos** ⏱️

---

## 🎯 Método Más Fácil: Arrastrar y Soltar

### **Paso 1: Crear Cuenta en Netlify**

1. Ve a: https://www.netlify.com/
2. Click en **"Sign up"** (arriba a la derecha)
3. Elige registrarte con:
   - GitHub (recomendado)
   - GitLab
   - Bitbucket
   - O con email

### **Paso 2: Preparar la Carpeta**

1. Asegúrate que la carpeta `web-app-netlify` contiene:
   ```
   ✅ index.html
   ✅ dashboard.html
   ✅ app.js
   ✅ styles.css
   ✅ netlify.toml
   ```

2. **¡NO comprimas la carpeta!** (no hagas .zip)
   - Netlify necesita ver los archivos directamente

### **Paso 3: Subir a Netlify**

1. En el dashboard de Netlify verás: **"Want to deploy a new site without connecting to Git?"**
2. Arrastra la carpeta `web-app-netlify` completa a esa área
   - O click en "Browse to upload"

3. Netlify comenzará a desplegar automáticamente
   - Verás una barra de progreso
   - Espera 10-30 segundos

### **Paso 4: ¡Listo!**

1. Netlify te mostrará tu nueva URL:
   ```
   https://random-name-12345.netlify.app
   ```

2. **Copia esa URL** - ¡es tu app!

3. Puedes cambiarle el nombre:
   - Click en "Site settings"
   - "Change site name"
   - Ejemplo: `karen-riego.netlify.app`

---

## 🎨 Personalizar el Nombre del Sitio

1. En el dashboard de tu sitio, click en **"Site settings"**
2. En "Site information" click en **"Change site name"**
3. Escribe un nombre único (ejemplo: `karen-riego`)
4. Click en "Save"
5. Tu URL ahora será: `https://karen-riego.netlify.app`

---

## 🔄 Actualizar la App (Después de Cambios)

Si haces cambios en el código:

1. Ve a tu sitio en Netlify
2. Click en la pestaña **"Deploys"**
3. Arrastra la carpeta actualizada a **"Drag and drop your site output folder here"**
4. Netlify desplegará la nueva versión automáticamente

---

## 🌐 Usar Tu Propio Dominio (Opcional)

Si tienes un dominio (ejemplo: `karen-riego.com`):

1. En Netlify, ve a **"Domain settings"**
2. Click en **"Add custom domain"**
3. Escribe tu dominio: `karen-riego.com`
4. Sigue las instrucciones para configurar DNS
5. Netlify te dará HTTPS gratis automáticamente

---

## 📱 Acceder desde Celular

1. Abre el navegador en tu celular
2. Escribe la URL: `https://tu-app.netlify.app`
3. **Guarda en favoritos** para acceso rápido
4. O agrega a pantalla de inicio (como app)

### **En iPhone:**
1. Safari → Compartir → "Agregar a pantalla de inicio"

### **En Android:**
1. Chrome → Menú (⋮) → "Agregar a pantalla de inicio"

---

## 🔒 Verificar que Funciona

### **1. Login:**
- Abre tu app: `https://tu-app.netlify.app`
- Usuario: `demo`
- Contraseña: `demo123`
- Deberías entrar al dashboard

### **2. Conexión MQTT:**
- En el dashboard debe decir: **🟢 Conectado**
- Si dice 🔴 Desconectado:
  - Espera 10-15 segundos
  - Recarga la página (F5)
  - Verifica que HiveMQ Cloud esté activo

### **3. Datos en Tiempo Real:**
- Deberías ver valores actualizándose
- Si no:
  - Verifica que los ESP32 estén encendidos
  - Revisa el "Registro de Eventos"

### **4. Controles:**
- Prueba cambiar modo: AUTO ↔ MANUAL
- En modo MANUAL, prueba encender/apagar bomba
- Deberías ver confirmación en el registro

---

## 🎯 URLs Importantes

### **Tu Sitio Web:**
```
https://tu-app.netlify.app
```

### **Panel de Netlify:**
```
https://app.netlify.com/
```

### **HiveMQ Console:**
```
https://console.hivemq.cloud/
```

---

## 🆘 Problemas Comunes

### **"Site not found" o Error 404:**
```
Solución:
1. Verifica que subiste TODA la carpeta
2. Verifica que incluiste netlify.toml
3. Reintenta subiendo de nuevo
```

### **Página en blanco:**
```
Solución:
1. Presiona F12 (Consola del navegador)
2. Ve a la pestaña "Console"
3. ¿Hay errores? Cópialos y revisa
4. Verifica que app.js y styles.css se cargaron
```

### **No conecta a MQTT:**
```
Solución:
1. Verifica credenciales en app.js
2. Ve a HiveMQ Console y verifica que el cluster está activo
3. Los ESP32 deben estar conectados primero
```

### **Botones no funcionan:**
```
Solución:
1. Espera a que MQTT se conecte (🟢)
2. Revisa el "Registro de Eventos"
3. Verifica que estés en el modo correcto (AUTO/MANUAL)
```

---

## 🌟 Funciones Extra de Netlify

### **1. Ver Estadísticas:**
- Visitas a tu sitio
- Ancho de banda usado
- Todo en el dashboard de Netlify

### **2. HTTPS Automático:**
- Netlify te da HTTPS gratis
- No necesitas configurar nada
- Tu app está segura por defecto

### **3. Protección con Contraseña:**
Para sitios privados:
1. Ve a "Site settings"
2. "Access control" → "Visitor access"
3. Activa "Password protection"
4. Establece una contraseña

### **4. Variables de Entorno:**
Si quieres ocultar credenciales:
1. "Site settings" → "Environment variables"
2. Agregar variables
3. Referenciarlas en el código

---

## 📊 Resumen Visual

```
┌─────────────────────────────────────┐
│  1. Crear cuenta en Netlify         │
│  ✓ https://www.netlify.com          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  2. Preparar carpeta                │
│  ✓ web-app-netlify/                 │
│     - index.html                    │
│     - dashboard.html                │
│     - app.js                        │
│     - styles.css                    │
│     - netlify.toml                  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  3. Arrastrar y soltar              │
│  ✓ Dashboard → Drop folder          │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  4. Esperar deploy (10-30 seg)      │
│  ✓ Publishing...                    │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│  5. ¡Listo! Obtener URL             │
│  ✓ https://tu-app.netlify.app       │
└─────────────────────────────────────┘
```

---

## 🎉 ¡Felicidades!

Ahora tienes tu sistema de riego accesible desde **cualquier lugar del mundo**:

- ✅ PC/Laptop
- ✅ Celular
- ✅ Tablet
- ✅ Desde cualquier WiFi o datos móviles

**Comparte la URL con quien quieras que tenga acceso** (recuerda darles las credenciales: demo/demo123)

---

## 💡 Consejos Pro

1. **Guarda la URL en favoritos** en todos tus dispositivos
2. **Toma captura** de las credenciales
3. **Cambia las credenciales demo** por unas propias (edita index.html)
4. **Monitorea el registro** para ver actividad
5. **Prueba desde distintos lugares** para verificar acceso

---

## 📞 Siguiente Nivel

¿Quieres mejorar más?
- Agrega múltiples usuarios
- Implementa notificaciones push
- Guarda histórico de datos
- Crea gráficas de tendencias
- Agrega alertas por SMS/Email

**¡Tu sistema está ahora al nivel de IoT profesional!** 🚀

---

**Tiempo total invertido: 5 minutos**  
**Costo: $0 (GRATIS)** 💰  
**Resultado: App web profesional accesible mundialmente** 🌍



