const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const config = require('../config');

let userTableColumns = new Set();

function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ lastID: this.lastID, changes: this.changes });
      }
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Conectar a base de datos
const db = new sqlite3.Database(config.DATABASE.FILE, async (err) => {
  if (err) {
    console.error('Error conectando a base de datos:', err);
  } else {
    console.log('✅ Conectado a base de datos SQLite');
    try {
      await initializeDatabase();
    } catch (initError) {
      console.error('Error inicializando base de datos:', initError);
    }
  }
});

async function ensureUserSchema() {
  try {
    const columns = await allAsync('PRAGMA table_info(users)');
    userTableColumns = new Set(columns.map(column => column.name));

    if (!userTableColumns.has('password_hash')) {
      await runAsync('ALTER TABLE users ADD COLUMN password_hash TEXT');
      console.log('✅ Columna password_hash agregada a tabla users');
      userTableColumns.add('password_hash');
    }

    if (!userTableColumns.has('updated_at')) {
      await runAsync('ALTER TABLE users ADD COLUMN updated_at DATETIME');
      console.log('✅ Columna updated_at agregada a tabla users');
      userTableColumns.add('updated_at');
      await runAsync('UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE updated_at IS NULL');
    }

    if (userTableColumns.has('password')) {
      const { changes } = await runAsync(
        'UPDATE users SET password_hash = password WHERE (password_hash IS NULL OR password_hash = "") AND password IS NOT NULL'
      );

      if (changes > 0) {
        console.log(`🔄 Migradas ${changes} contraseñas existentes a password_hash`);
      }
    }
  } catch (error) {
    console.error('Error asegurando esquema de usuarios:', error);
  }
}

// Inicializar base de datos
async function initializeDatabase() {
  // Crear tabla de usuarios
  await runAsync(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabla users creada/verificada');

  await ensureUserSchema();
  await createDefaultUsers();

  // Crear tabla de sensores
  await runAsync(`
    CREATE TABLE IF NOT EXISTS sensor_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      soil_moisture REAL,
      temperature REAL,
      humidity REAL,
      water_level REAL,
      pump_state TEXT,
      pump_mode TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabla sensor_data creada/verificada');

  // Crear tabla de comandos
  await runAsync(`
    CREATE TABLE IF NOT EXISTS commands (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      command_type TEXT NOT NULL,
      command_value TEXT NOT NULL,
      executed_by TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
  console.log('✅ Tabla commands creada/verificada');
}

// Crear usuarios por defecto
async function createDefaultUsers() {
  for (const user of config.DEFAULT_USERS) {
    try {
      const existing = await getUserByUsername(user.username);
      if (!existing) {
        await createUser(user.username, user.password, user.name, user.role);
        console.log(`✅ Usuario por defecto creado: ${user.username}`);
      }
    } catch (error) {
      console.error(`Error creando usuario por defecto ${user.username}:`, error);
    }
  }
}

// ========== FUNCIONES DE USUARIOS ==========

// Obtener usuario por username
function getUserByUsername(username) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Obtener usuario por ID
function getUserById(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT id, username, name, role, created_at FROM users WHERE id = ?', [id], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Obtener todos los usuarios
function getAllUsers() {
  return new Promise((resolve, reject) => {
    db.all('SELECT id, username, name, role, created_at FROM users ORDER BY created_at DESC', [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Crear usuario
async function createUser(username, password, name, role = 'user') {
  const passwordHash = await bcrypt.hash(password, 10);

  const columns = ['username', 'password_hash', 'name', 'role'];
  const placeholders = ['?', '?', '?', '?'];
  const values = [username, passwordHash, name, role];

  if (userTableColumns.has('password')) {
    columns.splice(1, 0, 'password');
    placeholders.splice(1, 0, '?');
    values.splice(1, 0, passwordHash);
  }

  if (userTableColumns.has('updated_at')) {
    columns.push('updated_at');
    placeholders.push('?');
    values.push(new Date().toISOString());
  }

  return new Promise((resolve, reject) => {
    db.run(
      `INSERT INTO users (${columns.join(', ')}) VALUES (${placeholders.join(', ')})`,
      values,
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID, username, name, role });
        }
      }
    );
  });
}

// Eliminar usuario
function deleteUser(id) {
  return new Promise((resolve, reject) => {
    // Verificar que no sea un usuario por defecto
    if (id <= 2) {
      reject(new Error('No se pueden eliminar usuarios por defecto'));
      return;
    }

    db.run('DELETE FROM users WHERE id = ?', [id], function(err) {
      if (err) {
        reject(err);
      } else if (this.changes === 0) {
        reject(new Error('Usuario no encontrado'));
      } else {
        resolve({ deleted: true });
      }
    });
  });
}

// Actualizar usuario
function updateUser(id, updates) {
  return new Promise((resolve, reject) => {
    const fields = [];
    const values = [];

    if (updates.name) {
      fields.push('name = ?');
      values.push(updates.name);
    }

    if (updates.role) {
      fields.push('role = ?');
      values.push(updates.role);
    }

    if (fields.length === 0) {
      reject(new Error('No hay campos para actualizar'));
      return;
    }

    if (userTableColumns.has('updated_at')) {
      fields.push('updated_at = CURRENT_TIMESTAMP');
    }

    values.push(id);

    db.run(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values,
      function(err) {
        if (err) {
          reject(err);
        } else if (this.changes === 0) {
          reject(new Error('Usuario no encontrado'));
        } else {
          resolve({ updated: true });
        }
      }
    );
  });
}

// Verificar contraseña
async function verifyPassword(username, password) {
  const user = await getUserByUsername(username);
  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.password_hash);
  if (!isValid) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    name: user.name,
    role: user.role
  };
}

// ========== FUNCIONES DE SENSORES ==========

// Guardar datos de sensores
function saveSensorData(data) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO sensor_data (soil_moisture, temperature, humidity, water_level, pump_state, pump_mode) VALUES (?, ?, ?, ?, ?, ?)',
      [data.soil_moisture, data.temperature, data.humidity, data.water_level, data.pump_state, data.pump_mode],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
}

// Obtener últimos datos de sensores
function getLatestSensorData(limit = 10) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM sensor_data ORDER BY created_at DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// Obtener estadísticas de sensores
function getSensorStats(hours = 24) {
  return new Promise((resolve, reject) => {
    const sql = `
      SELECT
        COUNT(*) as total_readings,
        AVG(soil_moisture) as avg_soil,
        MIN(soil_moisture) as min_soil,
        MAX(soil_moisture) as max_soil,
        AVG(temperature) as avg_temp,
        MIN(temperature) as min_temp,
        MAX(temperature) as max_temp,
        AVG(humidity) as avg_humidity,
        AVG(water_level) as avg_water
      FROM sensor_data
      WHERE created_at >= datetime('now', '-${hours} hours')
    `;

    db.get(sql, [], (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// ========== FUNCIONES DE COMANDOS ==========

// Guardar comando ejecutado
function saveCommand(commandType, commandValue, executedBy = 'system') {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO commands (command_type, command_value, executed_by) VALUES (?, ?, ?)',
      [commandType, commandValue, executedBy],
      function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ id: this.lastID });
        }
      }
    );
  });
}

// Obtener historial de comandos
function getCommandHistory(limit = 50) {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM commands ORDER BY created_at DESC LIMIT ?',
      [limit],
      (err, rows) => {
        if (err) {
          reject(err);
        } else {
          resolve(rows);
        }
      }
    );
  });
}

// ========== ESTADÍSTICAS GENERALES ==========

// Obtener estadísticas del sistema
function getSystemStats() {
  return new Promise((resolve, reject) => {
    const promises = [
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as user_count FROM users', [], (err, row) => {
          if (err) rej(err); else res(row.user_count);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as admin_count FROM users WHERE role = "admin"', [], (err, row) => {
          if (err) rej(err); else res(row.admin_count);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as sensor_count FROM sensor_data', [], (err, row) => {
          if (err) rej(err); else res(row.sensor_count);
        });
      }),
      new Promise((res, rej) => {
        db.get('SELECT COUNT(*) as command_count FROM commands', [], (err, row) => {
          if (err) rej(err); else res(row.command_count);
        });
      })
    ];

    Promise.all(promises)
      .then(([userCount, adminCount, sensorCount, commandCount]) => {
        resolve({
          users: userCount,
          admins: adminCount,
          sensor_readings: sensorCount,
          commands_executed: commandCount
        });
      })
      .catch(reject);
  });
}

// Cerrar base de datos (para testing)
function close() {
  return new Promise((resolve) => {
    db.close((err) => {
      if (err) {
        console.error('Error cerrando base de datos:', err);
      } else {
        console.log('✅ Base de datos cerrada');
      }
      resolve();
    });
  });
}

module.exports = {
  getUserByUsername,
  getUserById,
  getAllUsers,
  createUser,
  deleteUser,
  updateUser,
  verifyPassword,
  saveSensorData,
  getLatestSensorData,
  getSensorStats,
  saveCommand,
  getCommandHistory,
  getSystemStats,
  close
};
