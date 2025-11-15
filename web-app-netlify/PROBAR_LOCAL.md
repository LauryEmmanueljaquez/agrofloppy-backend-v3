# 🧪 Probar Localmente (Antes de Subir a Netlify)

Puedes probar la app en tu computadora antes de subirla a Netlify.

## 🚀 Método 1: Abrir Directamente (Más Fácil)

### **Paso 1: Abrir index.html**
1. Ve a la carpeta `web-app-netlify`
2. Haz doble click en `index.html`
3. Se abrirá en tu navegador

### **Paso 2: Login**
- Usuario: `demo`
- Contraseña: `demo123`

### **Paso 3: Probar Dashboard**
- Deberías ver el dashboard completo
- La conexión MQTT debería funcionar
- Los controles deberían responder

---

## 🔧 Método 2: Servidor Local (Recomendado)

Si el Método 1 no funciona (CORS/WebSocket), usa un servidor local:

### **Opción A: Python**

Si tienes Python instalado:

```bash
# Python 3
cd web-app-netlify
python -m http.server 8000
```

Luego abre: http://localhost:8000

### **Opción B: Node.js**

Si tienes Node.js instalado:

```bash
# Instalar servidor simple
npm install -g http-server

# Ejecutar
cd web-app-netlify
http-server -p 8000
```

Luego abre: http://localhost:8000

### **Opción C: Live Server (VS Code)**

Si usas Visual Studio Code:

1. Instala extensión "Live Server"
2. Click derecho en `index.html`
3. "Open with Live Server"

---

## ✅ Verificar que Funciona

### **1. Login ✓**
```
✅ Deberías poder entrar con demo/demo123
✅ Redirige a dashboard.html
```

### **2. Dashboard ✓**
```
✅ Se ve el diseño completo
✅ 4 tarjetas de sensores
✅ Controles de bomba
✅ Registro de eventos
```

### **3. MQTT ✓**
```
✅ Estado: 🟢 Conectado (después de 5-10 seg)
✅ Datos actualizándose
✅ Botones funcionando
```

---

## 🐛 Problemas al Probar Local

### **Error: "CORS policy"**
```
Solución: Usa un servidor local (Método 2)
No puedes abrir directamente index.html con MQTT
```

### **Error: "WebSocket connection failed"**
```
Solución:
1. Verifica credenciales MQTT en app.js
2. Verifica que HiveMQ Cloud esté activo
3. Prueba desde navegador Chrome/Edge
```

### **Login no funciona:**
```
Solución:
1. Presiona F12 → Console
2. Busca errores JavaScript
3. Verifica que app.js se cargó
```

---

## 🎯 Después de Probar Local

Si todo funciona localmente, **ya está listo para Netlify**:

1. Sigue la guía en `GUIA_NETLIFY.md`
2. Sube la carpeta completa
3. ¡Funcionará igual pero accesible desde internet!

---

## 💡 Diferencia Local vs Netlify

| Característica | Local | Netlify |
|----------------|-------|---------|
| Acceso | Solo tu PC | Internet mundial |
| URL | localhost:8000 | tu-app.netlify.app |
| HTTPS | No | Sí (gratis) |
| Permanente | No | Sí |
| Compartible | No | Sí |

---

**Recomendación:** Prueba local primero, luego sube a Netlify para acceso mundial. 🌍



