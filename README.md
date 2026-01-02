# Bazar El Romero - E-commerce Application

Una aplicación de e-commerce completa con frontend y backend separados para máxima seguridad y flexibilidad.

## 🏗️ Arquitectura del Proyecto

```
bazar-el-romero/
├── backend/          # API RESTful con Node.js + Express
├── frontend/         # Interfaz de usuario (HTML + JavaScript vanilla)
├── docs/            # Documentación adicional
└── README.md        # Este archivo
```

## 🔒 Características de Seguridad

- **Frontend y Backend separados**: El frontend no tiene acceso directo a los datos del backend
- **API RESTful con prefijo `/api`**: Todas las rutas de API están protegidas
- **CORS configurado**: Solo permite conexiones desde dominios específicos
- **Autenticación JWT**: Tokens seguros para operaciones administrativas
- **Validación de datos**: Sanitización de inputs para prevenir XSS
- **Rate limiting**: Protección contra ataques de fuerza bruta
- **Datos sensibles excluidos**: `.env`, `catalog.json`, `users.json` no se suben al repositorio

## 🚀 Instalación y Configuración

### Prerrequisitos

- Node.js >= 14.0.0
- npm >= 6.0.0
- Python 3.x (para servir el frontend)

### Instalación Rápida

```bash
# 1. Instalar dependencias del backend
npm run install:backend

# 2. Generar credenciales seguras
npm run setup:backend

# 3. (Opcional) Instalar concurrently para desarrollo
npm install -g concurrently
```

### Desarrollo

```bash
# Opción 1: Ejecutar ambos servicios por separado
npm run dev:backend    # Backend en puerto 3000
npm run dev:frontend   # Frontend en puerto 8080

# Opción 2: Ejecutar ambos con un solo comando
npm run dev
```

### Producción

```bash
# Backend
npm run start:backend

# Frontend (servir con cualquier servidor web)
# Por ejemplo con Python:
cd frontend && python -m http.server 8080
```

## 📁 Estructura Detallada

### Backend (`/backend`)

```
backend/
├── server.js              # Servidor principal
├── server_production.js   # Configuración de producción
├── generate-credentials.js # Generador de credenciales
├── package.json           # Dependencias de Node.js
├── .env.example          # Ejemplo de variables de entorno
├── .gitignore            # Archivos excluidos de Git
└── data/                 # Datos de la aplicación (NO en Git)
    ├── catalog.json      # Catálogo de productos
    ├── users.json        # Usuarios del sistema
    └── images/           # Imágenes de productos
```

**Endpoints principales:**
- `GET /api/products` - Obtener productos (público)
- `POST /api/auth/login` - Iniciar sesión (público)
- `POST /api/products` - Crear producto (protegido)
- `PUT /api/products/:id` - Actualizar producto (protegido)
- `DELETE /api/products/:id` - Eliminar producto (protegido)
- `POST /api/upload-image` - Subir imagen (protegido)

### Frontend (`/frontend`)

```
frontend/
├── index.html            # Tienda principal
├── cargarprodustos.html  # Panel de administración
├── logofrank.jpg         # Logo de la empresa
├── hola5.png             # Imagen promocional
├── .gitignore            # Archivos excluidos de Git
└── images/               # Imágenes de productos (copia para desarrollo)
```

**Funcionalidades:**
- 🛒 Carrito de compras
- 🏪 Catálogo de productos con filtros
- 📱 Diseño responsive
- 🔐 Panel administrativo protegido
- 📞 Integración con WhatsApp

## 🔧 Configuración

### Variables de Entorno Backend

Crear archivo `.env` en la carpeta `backend/`:

```env
# Obligatorio en producción
JWT_SECRET=tu_jwt_secret_muy_largo_y_seguro

# URLs permitidas para CORS (separadas por comas)
ALLOWED_ORIGINS=http://localhost:8080,http://localhost:3000,https://tu-dominio.com

# Puerto del servidor
PORT=3000

# Configuración de base de datos (futuro)
# DATABASE_URL=postgresql://usuario:password@localhost:5432/bazar
```

### Configuración de CORS

Por defecto, el backend solo permite conexiones desde:
- `http://localhost:8080` (frontend en desarrollo)
- `http://localhost:3000` (mismo dominio)

Para producción, actualiza `ALLOWED_ORIGINS` en el archivo `.env`.

## 📊 API Documentation

### Autenticación

```javascript
// Login
POST /api/auth/login
{
  "username": "admin",
  "password": "tu_password"
}

// Response
{
  "token": "jwt_token_aqui"
}
```

### Productos

```javascript
// Obtener todos los productos
GET /api/products

// Obtener un producto específico
GET /api/products/:id

// Crear producto (requiere token)
POST /api/products
Authorization: Bearer <token>
{
  "nombre": "Producto de ejemplo",
  "precio": 100.50,
  "categoria": "Ropa de Mujer",
  "disponible": true,
  "img": "/api/images/imagen.jpg"
}
```

## 🛡️ Medidas de Seguridad Implementadas

1. **Separación de Frontend/Backend**: El frontend no puede acceder directamente a los datos
2. **API RESTful**: Todas las operaciones pasan por endpoints controlados
3. **Validación de entrada**: Sanitización de todos los inputs del usuario
4. **Rate limiting**: Máximo 5 intentos de login por IP en 15 minutos
5. **CORS restrictivo**: Solo dominios autorizados pueden hacer requests
6. **JWT tokens**: Autenticación segura con expiración
7. **Archivos sensibles excluidos**: Datos y credenciales no se suben a Git

## 🚀 Deployment

### Backend (Railway, Heroku, DigitalOcean, etc.)

1. Subir carpeta `backend/`
2. Configurar variables de entorno
3. Ejecutar `npm install`
4. Ejecutar `npm start`

### Frontend (Netlify, Vercel, GitHub Pages, etc.)

1. Subir carpeta `frontend/`
2. Configurar redirects si es necesario
3. Servir archivos estáticos

## 🤝 Contribución

1. Fork del repositorio
2. Crear branch para feature (`git checkout -b feature/nueva-caracteristica`)
3. Commit de cambios (`git commit -am 'Agregar nueva característica'`)
4. Push al branch (`git push origin feature/nueva-caracteristica`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver `LICENSE` para más detalles.

## 📞 Soporte

Para soporte técnico o preguntas:
- Crear un issue en GitHub
- Contactar al desarrollador

---

**¡Bazar El Romero - Villa Clara!** 🛍️
