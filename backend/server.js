const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');

const app = express();

// Configurar CORS de forma más segura
const allowedOrigins = process.env.ALLOWED_ORIGINS ? 
  process.env.ALLOWED_ORIGINS.split(',') : 
  ['http://localhost:3000', 'http://localhost:8080', 'http://127.0.0.1:3000', 'http://127.0.0.1:8080'];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir requests sin origin (como mobile apps o postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));

// JWT secret - DEBE ser cambiado en producción usando variable de entorno
const JWT_SECRET = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');

const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'catalog.json');
const IMAGES_DIR = path.join(DATA_DIR, 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]', 'utf8');
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR, { recursive: true });

// NO SERVIR ARCHIVOS ESTÁTICOS DESDE EL BACKEND POR SEGURIDAD
// El frontend se sirve por separado

// Solo servir imágenes de productos de forma controlada
app.use('/api/images', express.static(IMAGES_DIR, {
  maxAge: '1d', // Cache de 1 día
  setHeaders: (res, path) => {
    // Solo permitir imágenes
    if (!path.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
      res.setHeader('Content-Type', 'application/octet-stream');
    }
  }
}));

// Multer setup for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, IMAGES_DIR);
  },
  filename: function (req, file, cb) {
    // create a unique filename preserving extension
    const ext = path.extname(file.originalname) || '.jpg';
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  }
});
// Validar tipos de archivo permitidos
const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
const fileFilter = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Tipo de archivo no permitido. Solo imágenes: JPEG, PNG, GIF, WEBP'));
  }
};

const upload = multer({ 
  storage, 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: fileFilter
});

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8') || '[]';
    const arr = JSON.parse(raw);
    // Ensure existing items have an `active` flag (default true)
    return arr.map(item => (Object.assign({ active: true }, item)));
  } catch (e) {
    console.error('Error leyendo datos:', e);
    return [];
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
  } catch (e) {
    console.error('Error guardando datos:', e);
  }
}

// Rate limiting simple (en producción usar express-rate-limit)
const loginAttempts = new Map();
const MAX_LOGIN_ATTEMPTS = 5;
const LOGIN_WINDOW = 15 * 60 * 1000; // 15 minutos

function checkRateLimit(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, resetTime: now + LOGIN_WINDOW };
  
  if (now > attempts.resetTime) {
    attempts.count = 0;
    attempts.resetTime = now + LOGIN_WINDOW;
  }
  
  if (attempts.count >= MAX_LOGIN_ATTEMPTS) {
    return false;
  }
  
  attempts.count++;
  loginAttempts.set(ip, attempts);
  return true;
}

// Validación de inputs
function validateProduct(product) {
  const errors = [];
  if (!product.nombre || typeof product.nombre !== 'string' || product.nombre.trim().length === 0) {
    errors.push('Nombre es requerido');
  }
  if (product.nombre && product.nombre.length > 200) {
    errors.push('Nombre muy largo (máx 200 caracteres)');
  }
  if (typeof product.precio !== 'number' || product.precio < 0) {
    errors.push('Precio debe ser un número positivo');
  }
  if (product.categoria && product.categoria.length > 100) {
    errors.push('Categoría muy larga');
  }
  if (product.img && typeof product.img === 'string' && product.img.length > 500) {
    errors.push('URL de imagen muy larga');
  }
  // Validar URL de imagen si se proporciona
  if (product.img && typeof product.img === 'string' && !product.img.startsWith('data:') && !product.img.startsWith('http://') && !product.img.startsWith('https://') && !product.img.startsWith('/api/images/')) {
    errors.push('URL de imagen inválida');
  }
  return errors;
}

// Sanitizar strings (remover caracteres peligrosos)
function sanitizeString(str) {
  if (typeof str !== 'string') return '';
  return str.trim().replace(/[<>]/g, '');
}

// Authentication middleware
function authenticate(req, res, next) {
  const auth = req.headers['authorization'];
  if (!auth) return res.status(401).json({ error: 'No token' });
  const parts = auth.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return res.status(401).json({ error: 'Invalid token' });
  const token = parts[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// List all products (public)
app.get('/api/products', (req, res) => {
  const data = readData();
  // If query ?all=true is requested and a valid token is provided, return everything
  const wantAll = req.query && String(req.query.all).toLowerCase() === 'true';
  if (wantAll && req.headers['authorization']) {
    const auth = req.headers['authorization'];
    const parts = auth.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      try {
        jwt.verify(parts[1], JWT_SECRET);
        return res.json(data);
      } catch (e) {
        // invalid token -> fallthrough to public view
      }
    }
  }
  // Public view: only show active products (and optionally those marked disponible)
  const publicList = data.filter(p => p.active !== false && (p.disponible !== false));
  res.json(publicList);
});

// Get one product (public)
app.get('/api/products/:id', (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const p = data.find(x => x.id === id);
  if (!p) return res.status(404).json({ error: 'Not found' });
  res.json(p);
});

// Create product (protected)
app.post('/api/products', authenticate, (req, res) => {
  const payload = req.body || {};
  const validationErrors = validateProduct(payload);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validación fallida', details: validationErrors });
  }
  
  const data = readData();
  const id = payload.id || Date.now();
  const product = {
    id,
    nombre: sanitizeString(payload.nombre || ''),
    precio: Number(payload.precio) || 0,
    categoria: sanitizeString(payload.categoria || ''),
    disponible: !!payload.disponible,
    img: payload.img || '',
    active: payload.active !== false
  };
  data.push(product);
  writeData(data);
  res.status(201).json(product);
});

// Update product (protected)
app.put('/api/products/:id', authenticate, (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  const validationErrors = validateProduct(payload);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validación fallida', details: validationErrors });
  }
  
  const data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  // Merge updates but keep id, sanitizando campos de texto
  const updated = Object.assign({}, data[idx], {
    nombre: payload.nombre !== undefined ? sanitizeString(payload.nombre) : data[idx].nombre,
    precio: payload.precio !== undefined ? Number(payload.precio) : data[idx].precio,
    categoria: payload.categoria !== undefined ? sanitizeString(payload.categoria) : data[idx].categoria,
    disponible: payload.disponible !== undefined ? !!payload.disponible : data[idx].disponible,
    img: payload.img !== undefined ? payload.img : data[idx].img,
    active: payload.active !== undefined ? !!payload.active : data[idx].active,
    id
  });
  data[idx] = updated;
  writeData(data);
  res.json(updated);
});

// Delete product (protected) - Soft delete
app.delete('/api/products/:id', authenticate, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  // Soft-delete: mark as inactive
  data[idx].active = false;
  writeData(data);
  res.json({ ok: true, message: 'Producto desactivado correctamente', product: data[idx] });
});

// Hard delete product (protected) - Complete removal
app.delete('/api/products/:id/hard', authenticate, (req, res) => {
  const id = Number(req.params.id);
  const data = readData();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) return res.status(404).json({ error: 'Not found' });
  
  const deletedProduct = data[idx];
  data.splice(idx, 1); // Remove completely
  writeData(data);
  res.json({ ok: true, message: 'Producto eliminado completamente', product: deletedProduct });
});

// Import (replace all) (protected)
app.post('/api/import', authenticate, (req, res) => {
  const payload = req.body;
  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Array expected' });
  
  // Validar y sanitizar todos los productos
  const validatedProducts = [];
  for (const product of payload) {
    const errors = validateProduct(product);
    if (errors.length === 0) {
      validatedProducts.push({
        ...product,
        nombre: sanitizeString(product.nombre || ''),
        categoria: sanitizeString(product.categoria || ''),
        precio: Number(product.precio) || 0
      });
    }
  }
  
  writeData(validatedProducts);
  res.json({ ok: true, count: validatedProducts.length, rejected: payload.length - validatedProducts.length });
});

// Upload image (protected)
app.post('/api/upload-image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  // return a URL that can be used in products
  const url = `/api/images/${req.file.filename}`;
  res.json({ url });
});

// ----- Simple auth routes -----
const USERS_FILE = path.join(DATA_DIR, 'users.json');
if (!fs.existsSync(USERS_FILE)) {
  const hashed = bcrypt.hashSync('admin123', 8);
  fs.writeFileSync(USERS_FILE, JSON.stringify([{ id: 1, username: 'admin', password: hashed }], null, 2));
}

function readUsers() {
  try {
    const raw = fs.readFileSync(USERS_FILE, 'utf8') || '[]';
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error reading users:', e);
    return [];
  }
}

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });
  
  // Rate limiting
  const clientIp = req.ip || req.connection.remoteAddress;
  if (!checkRateLimit(clientIp)) {
    return res.status(429).json({ error: 'Demasiados intentos. Intenta más tarde.' });
  }
  
  // Validar formato de username y password
  if (typeof username !== 'string' || username.length < 3 || username.length > 50) {
    return res.status(400).json({ error: 'Username inválido' });
  }
  if (typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ error: 'Password debe tener al menos 6 caracteres' });
  }
  
  const users = readUsers();
  const user = users.find(u => u.username === username);
  if (!user) {
    // No revelar si el usuario existe o no (mejor seguridad)
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }
  
  // Resetear intentos en login exitoso
  loginAttempts.delete(clientIp);
  
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

// Change password (protected)
app.post('/api/auth/change-password', authenticate, (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword required' });
  
  // Validar nueva contraseña
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Nueva contraseña debe tener al menos 6 caracteres' });
  }
  
  const users = readUsers();
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (!bcrypt.compareSync(oldPassword, user.password)) return res.status(401).json({ error: 'Contraseña actual incorrecta' });
  
  // Validar que la nueva contraseña sea diferente
  if (bcrypt.compareSync(newPassword, user.password)) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
  }
  
  user.password = bcrypt.hashSync(newPassword, 10); // Aumentar rounds de bcrypt
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'No se pudo guardar la contraseña' });
  }
});

// Middleware para obtener IP real (útil para rate limiting)
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Escuchar en todas las interfaces de red
app.listen(PORT, HOST, () => {
  console.log(`🚀 ===========================================`);
  console.log(`🛍️  BAZAR EL ROMERO - SERVIDOR INICIADO`);
  console.log(`🚀 ===========================================`);
  console.log(`📍 URL Local: http://localhost:${PORT}`);
  console.log(`📍 Red Local: http://[TU_IP_LOCAL]:${PORT}`);
  console.log(`🔗 API Endpoints: http://localhost:${PORT}/api/`);
  console.log(`🖼️  Images: http://localhost:${PORT}/api/images/`);
  console.log(`🔐 Admin Login: POST /api/auth/login`);
  console.log(`📦 Products: GET/POST/PUT/DELETE /api/products`);
  console.log(`🚀 ===========================================`);
  console.log('⚠️  IMPORTANTE: En producción, configura JWT_SECRET y ALLOWED_ORIGINS como variables de entorno');
  console.log('⚠️  FRONTEND debe ejecutarse por separado en puerto 8080 o similar');
});
