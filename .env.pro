# ===========================================
# CONFIGURACIÓN DE PRODUCCIÓN - BAZAR EL ROMERO
# ===========================================

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000

# Clave secreta para JWT (OBLIGATORIO EN PRODUCCIÓN)
# Genera una clave única con: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
JWT_SECRET=7a8f9e0d1c2b3a4e5f6d7c8b9a0e1f2d3c4b5a6e7f8d9c0b1a2e3f4d5c6b7a8e9f0d1c2b3a4e5f6d7c8b9a0e1f2d3c4b5a6e7f8d9c0b1a2e3f4d5c6b7a8e9f0d1c2b3a4e5f6d7c8b9a0e1f2d3c4b5a6e7f8d9c0b1a2e3f4d5c6b7a8e9f0d1c2b3a4e5f6d7c8b9a0e1f2

# Dominio de tu aplicación (para CORS)
# Ejemplo: https://bazar-el-romero.herokuapp.com,https://bazarromero.com
ALLOWED_ORIGINS=http://localhost:3000,https://tu-dominio.com

# Credenciales de administrador (CAMBIAR EN PRODUCCIÓN)
ADMIN_USERNAME=bazar_admin
ADMIN_PASSWORD=MiTiendaSegura2025!

# ===========================================
# INSTRUCCIONES:
# ===========================================
# 1. Este archivo ya está configurado para desarrollo
# 2. Para producción:
#    - Genera un JWT_SECRET único
#    - Cambia las credenciales de admin
#    - Actualiza ALLOWED_ORIGINS con tu dominio real
# 3. Copia este archivo como .env si vas a usar el servidor de producción