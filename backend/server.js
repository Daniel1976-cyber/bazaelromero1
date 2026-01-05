const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://qrnjpovomhbgyqsnhufe.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY; // Service key preferred, or Anon if using policies
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
const IMAGES_DIR = path.join(DATA_DIR, 'images');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
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

// Helper to get all products
async function getAllProducts() {
  const { data, error } = await supabase.from('products').select('*');
  if (error) {
    console.error('Error fetching products:', error);
    return [];
  }
  return data;
}

// Write data functions are removed in favor of direct DB status updates

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
app.get('/api/products', async (req, res) => {
  const data = await getAllProducts();

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
app.get('/api/products/:id', async (req, res) => {
  const id = Number(req.params.id);
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single();
  if (error || !data) return res.status(404).json({ error: 'Not found' });
  res.json(data);
});

// Create product (protected)
app.post('/api/products', authenticate, async (req, res) => {
  const payload = req.body || {};
  const validationErrors = validateProduct(payload);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validación fallida', details: validationErrors });
  }

  // Supabase handles ID generation if not provided, or uses provided if it's unique.
  // For simplicity, we'll let Supabase handle it if `id` is not explicitly set in payload.
  const product = {
    nombre: sanitizeString(payload.nombre || ''),
    precio: Number(payload.precio) || 0,
    categoria: sanitizeString(payload.categoria || ''),
    disponible: !!payload.disponible,
    img: payload.img || '',
    active: payload.active !== false
  };

  const { data, error } = await supabase.from('products').insert([product]).select(); // .select() to return the inserted data

  if (error) {
    console.error('Error creando producto:', error);
    return res.status(500).json({ error: 'Error interno al crear el producto' });
  }
  res.status(201).json(data[0]); // Return the first (and only) inserted product
});

// Update product (protected)
app.put('/api/products/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const payload = req.body || {};
  const validationErrors = validateProduct(payload);
  if (validationErrors.length > 0) {
    return res.status(400).json({ error: 'Validación fallida', details: validationErrors });
  }

  // Fetch existing
  const { data: existing, error: fetchError } = await supabase.from('products').select('*').eq('id', id).single();
  if (fetchError || !existing) return res.status(404).json({ error: 'Not found' });

  const updated = {
    nombre: payload.nombre !== undefined ? sanitizeString(payload.nombre) : existing.nombre,
    precio: payload.precio !== undefined ? Number(payload.precio) : existing.precio,
    categoria: payload.categoria !== undefined ? sanitizeString(payload.categoria) : existing.categoria,
    disponible: payload.disponible !== undefined ? !!payload.disponible : existing.disponible,
    img: payload.img !== undefined ? payload.img : existing.img,
    active: payload.active !== undefined ? !!payload.active : existing.active,
  };

  const { data, error } = await supabase.from('products').update(updated).eq('id', id).select();
  if (error) {
    console.error('Error actualizando producto:', error);
    return res.status(500).json({ error: 'Error actualizando el producto' });
  }
  res.json(data[0]); // Return the updated product
});

// Delete product (protected) - Soft delete
app.delete('/api/products/:id', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const { data, error } = await supabase.from('products').update({ active: false }).eq('id', id).select();
  if (error) {
    console.error('Error desactivando producto:', error);
    return res.status(500).json({ error: 'Error desactivando el producto' });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado para desactivar' });
  }
  res.json({ ok: true, message: 'Producto desactivado correctamente', product: data[0] });
});

// Hard delete product (protected) - Complete removal
app.delete('/api/products/:id/hard', authenticate, async (req, res) => {
  const id = Number(req.params.id);
  const { data, error } = await supabase.from('products').delete().eq('id', id).select();
  if (error) {
    console.error('Error eliminando producto:', error);
    return res.status(500).json({ error: 'Error eliminando el producto' });
  }
  if (!data || data.length === 0) {
    return res.status(404).json({ error: 'Producto no encontrado para eliminar' });
  }
  res.json({ ok: true, message: 'Producto eliminado completamente', product: data[0] });
});

// Import (replace all) (protected)
app.post('/api/import', authenticate, async (req, res) => {
  const payload = req.body;
  if (!Array.isArray(payload)) return res.status(400).json({ error: 'Array expected' });

  // Validar y sanitizar todos los productos
  const validatedProducts = [];
  for (const product of payload) {
    const errors = validateProduct(product);
    if (errors.length === 0) {
      validatedProducts.push({
        nombre: sanitizeString(product.nombre || ''),
        categoria: sanitizeString(product.categoria || ''),
        precio: Number(product.precio) || 0,
        disponible: !!product.disponible,
        img: product.img || '',
        active: product.active !== false
      });
    }
  }

  // Delete all existing products
  const { error: deleteError } = await supabase.from('products').delete().neq('id', 0); // Delete all where id is not 0 (i.e., all)
  if (deleteError) {
    console.error('Error al eliminar productos existentes:', deleteError);
    return res.status(500).json({ error: 'Error al limpiar productos existentes' });
  }

  // Insert new products
  const { data: insertedData, error: insertError } = await supabase.from('products').insert(validatedProducts).select();
  if (insertError) {
    console.error('Error al importar nuevos productos:', insertError);
    return res.status(500).json({ error: 'Error al importar nuevos productos' });
  }

  res.json({ ok: true, count: insertedData.length, rejected: payload.length - validatedProducts.length });
});

// Upload image (protected)
app.post('/api/upload-image', authenticate, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'File required' });
  // return a URL that can be used in products
  const url = `/api/images/${req.file.filename}`;
  res.json({ url });
});

// ----- Simple auth routes -----
// No local users file anymore
// Initial user creation should be done directly in Supabase or via a separate setup script.
// For example, you could have a 'users' table in Supabase with 'id', 'username', 'password' columns.

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username/password required' });

  // Rate limiting (simplified for now, keep memory map or move to Redis/DB)
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

  const { data: user, error } = await supabase.from('users').select('*').eq('username', username).single();

  if (!user || error) {
    // No revelar si el usuario existe o no (mejor seguridad)
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  const ok = bcrypt.compareSync(password, user.password);
  if (!ok) {
    return res.status(401).json({ error: 'Credenciales inválidas' });
  }

  loginAttempts.delete(clientIp);
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '8h' });
  res.json({ token });
});

app.post('/api/auth/change-password', authenticate, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword) return res.status(400).json({ error: 'oldPassword and newPassword required' });

  // Validar nueva contraseña
  if (typeof newPassword !== 'string' || newPassword.length < 6) {
    return res.status(400).json({ error: 'Nueva contraseña debe tener al menos 6 caracteres' });
  }

  const { data: user, error: fetchError } = await supabase.from('users').select('*').eq('id', req.user.id).single();
  if (fetchError || !user) return res.status(404).json({ error: 'User not found' });

  if (!bcrypt.compareSync(oldPassword, user.password)) return res.status(401).json({ error: 'Contraseña actual incorrecta' });

  // Validar que la nueva contraseña sea diferente
  if (bcrypt.compareSync(newPassword, user.password)) {
    return res.status(400).json({ error: 'La nueva contraseña debe ser diferente a la actual' });
  }

  const newHash = bcrypt.hashSync(newPassword, 10); // Aumentar rounds de bcrypt
  const { error } = await supabase.from('users').update({ password: newHash }).eq('id', user.id);

  if (error) {
    console.error('Error actualizando contraseña:', error);
    return res.status(500).json({ error: 'No se pudo guardar la nueva contraseña' });
  }
  res.json({ ok: true });
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
