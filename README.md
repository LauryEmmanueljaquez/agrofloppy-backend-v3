# Floppy Backend 🌊🚀

Backend del sistema **Floppy**, una plataforma IoT para monitoreo y gestión inteligente de agua (inundaciones, riego y niveles de tanque).  
Este servicio expone una API para:

- Registrar y gestionar dispositivos (nodos, bombas, sensores, compuertas).
- Recibir telemetría desde los nodos IoT.
- Aplicar reglas de alerta y automatización.
- Enviar notificaciones y comandos de control.
- Proveer datos a paneles web y aplicaciones móviles.

> 🔧 Proyecto en desarrollo activo. La arquitectura y los endpoints pueden cambiar.

---

## 🧱 Arquitectura general

El backend de Floppy se encarga de:

- API REST en **Node.js** para consumo por frontend web y apps móviles.
- Integración con nodos IoT (HTTP/MQTT, según implementación).
- Persistencia de datos (sensores, eventos, usuarios, zonas, reglas).
- Motor básico de reglas (umbrales, tiempos, estados de alarma).
- Gestión de autenticación y permisos (operadores, administradores, etc).



---

## 🛠️ Tecnologías utilizadas



- **Node.js 18+**
- **Express** 
- Base de datos: **PostgreSQL / MySQL / MongoDB**
- ORM/ODM: **Prisma**, **TypeORM**, **Mongoose**, etc.
- Autenticación: **JWT**
- Mensajería IoT  **MQTT (Mosquitto)** o HTTP
- Contenedores: **Docker / Docker Compose** (opcional)

---

## 📂 Estructura del proyecto 

```bash
floppy-backend/
├── src/
│   ├── index.js            # Punto de entrada del servidor
│   ├── config/             # Configuración y variables de entorno
│   ├── routes/             # Rutas / endpoints
│   ├── controllers/        # Controladores (lógica por endpoint)
│   ├── services/           # Lógica de negocio
│   ├── models/             # Modelos / esquemas de BD
│   ├── middlewares/        # Middlewares (auth, logs, etc.)
│   └── utils/              # Utilidades generales
├── tests/                  # Pruebas
├── .env.example            # Ejemplo de variables de entorno
├── package.json
├── docker-compose.yml      # (Opcional)
└── README.md
