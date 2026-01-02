#!/usr/bin/env node

// ===========================================
// GENERADOR DE CREDENCIALES SEGURAS
// Bazar El Romero - Configuración de Producción
// ===========================================

const crypto = require('crypto');

console.log('🔐 ===========================================');
console.log('🛍️  GENERADOR DE CREDENCIALES SEGURAS');
console.log('🔐 ===========================================');

// Generar JWT_SECRET seguro
function generateJWT() {
  return crypto.randomBytes(64).toString('hex');
}

// Generar credenciales de administrador
function generateAdminCredentials() {
  const adminUser = 'bazar_' + Math.random().toString(36).slice(2, 8);
  const adminPass = 'MiTienda' + Math.random().toString(36).slice(2, 6) + '2025!';
  return { username: adminUser, password: adminPass };
}

// Generar dominios permitidos
function generateAllowedOrigins() {
  const domains = [
    'http://localhost:3000',
    'https://localhost:3000',
    'https://bazar-el-romero.herokuapp.com',
    'https://bazarromero.com',
    'https://www.bazarromero.com'
  ];
  return domains.join(',');
}

const jwtSecret = generateJWT();
const adminCreds = generateAdminCredentials();
const allowedOrigins = generateAllowedOrigins();

console.log('\n📝 CREDENCIALES GENERADAS:');
console.log('🔑 ===========================================');

console.log('\n🏷️  JWT_SECRET (Para el archivo .env):');
console.log(jwtSecret);

console.log('\n👤 CREDENCIALES DE ADMINISTRADOR:');
console.log('   Usuario:', adminCreds.username);
console.log('   Contraseña:', adminCreds.password);

console.log('\n🌐 ALLOWED_ORIGINS (Para el archivo .env):');
console.log(allowedOrigins);

console.log('\n📄 ARCHIVO .env COMPLETO:');
console.log('🔑 ===========================================');

const envContent = `# ===========================================
# CONFIGURACIÓN DE PRODUCCIÓN - BAZAR EL ROMERO
# ===========================================

# Puerto del servidor
PORT=3000

# Clave secreta para JWT (OBLIGATORIO EN PRODUCCIÓN)
JWT_SECRET=${jwtSecret}

# Dominios permitidos (CORS)
ALLOWED_ORIGINS=${allowedOrigins}

# Credenciales de administrador
ADMIN_USERNAME=${adminCreds.username}
ADMIN_PASSWORD=${adminCreds.password}

# ===========================================
# INSTRUCCIONES:
# ===========================================
# 1. Copia estas credenciales a tu archivo .env
# 2. Para producción, actualiza ALLOWED_ORIGINS con tu dominio real
# 3. Guarda estas credenciales en un lugar seguro
# 4. NO compartas el JWT_SECRET con nadie
`;

console.log(envContent);

console.log('✅ Credenciales generadas exitosamente!');
console.log('💡 Guarda estas credenciales en un lugar seguro');
console.log('🔐 ===========================================');

// Guardar credenciales en archivo (opcional)
const fs = require('fs');
const credsFile = './credenciales-seguras.txt';
fs.writeFileSync(credsFile, envContent);
console.log(`📁 Credenciales guardadas en: ${credsFile}`);
console.log('⚠️  Elimina este archivo después de configurar el servidor');