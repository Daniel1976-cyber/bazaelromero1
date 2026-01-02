# 🛍️ GUÍA DE INSTALACIÓN COMPLETA - BAZAR EL ROMERO

## 📋 **¿QUÉ ES ESTO?**

Esta es tu tienda online completa que incluye:

- 🏪 **Tienda pública** - Donde los clientes ven y compran productos
- 🔐 **Panel de administración** - Para que tú gestiones productos, precios, imágenes
- 📱 **Completamente responsive** - Funciona en computadoras, tablets y celulares
- 🛒 **Sistema de carrito** - Los clientes pueden hacer pedidos por WhatsApp

---

## 🚀 **PARA ACCEDER DESDE CUALQUIER DISPOSITIVO**

### **Opción 1: En tu computadora local (para desarrollo)**
```
1. Abre una terminal/cmd en la carpeta del proyecto
2. Ejecuta: node server.js
3. Abre tu navegador en: http://localhost:3000
```

### **Opción 2: En un servidor web (PRODUCCIÓN)**
```
1. Sube todos los archivos a un servidor como Heroku, Vercel o DigitalOcean
2. Configura las variables de entorno (ver sección de producción)
3. Accede desde cualquier dispositivo con tu dominio
```

---

## 📱 **CÓMO USAR DESDE CELULAR/TABLET**

### **Paso 1: Configuración de Acceso**
1. **Instala Node.js** en tu computadora: https://nodejs.org
2. **Abre terminal/cmd** y navega a la carpeta del proyecto
3. **Instala dependencias**: `npm install`
4. **Inicia el servidor**: `node server.js`

### **Paso 2: Acceso desde Cualquier Dispositivo**
1. **Abre navegador** en tu celular/tablet
2. **Ve a**: `http://[IP-de-tu-computadora]:3000`
3. **Para obtener tu IP**:
   - Windows: `ipconfig` en cmd
   - Mac/Linux: `ifconfig` en terminal
   - Busca la IP que comienza con 192.168.x.x

### **Ejemplo práctico:**
Si tu IP es `192.168.1.100`, entonces accedes con:
```
http://192.168.1.100:3000
```

---

## 🔐 **GESTIÓN DE PRODUCTOS**

### **Acceder al Panel de Administración**
1. **Ve a**: `http://localhost:3000/cargar produstos.html`
2. **Inicia sesión** con:
   - Usuario: `admin`
   - Contraseña: `admin123`

### **Funciones Disponibles:**
- ✅ **Añadir productos** - Con nombre, precio, categoría e imagen
- ✏️ **Editar productos** - Modifica cualquier información
- 🔓 **Activar/Desactivar** - Oculta productos sin borrarlos
- 🗑️ **Eliminar productos** - Borrado permanente
- 📥 **Importar desde Excel** - Carga masiva de productos
- 📊 **Exportar catálogo** - Respaldo en Excel o JSON

---

## 🔧 **CONFIGURACIÓN DE PRODUCCIÓN**

### **Paso 1: Generar Credenciales Seguras**
```bash
node generate-credentials.js
```
Esto creará credenciales únicas y seguras.

### **Paso 2: Crear Archivo .env**
1. **Copia el contenido** del archivo `.env.production`
2. **Pégalo en un nuevo archivo** llamado `.env`
3. **Actualiza** las variables según tus necesidades

### **Paso 3: Usar el Servidor de Producción**
```bash
node server_production.js
```

### **Variables Importantes:**
- `JWT_SECRET` - Clave de seguridad (CRÍTICO)
- `ADMIN_USERNAME` - Tu usuario de administrador
- `ADMIN_PASSWORD` - Tu contraseña de administrador
- `ALLOWED_ORIGINS` - Dominios permitidos

---

## 🌍 **DESPLIEGUE EN SERVIDOR WEB**

### **Heroku (Gratis)**
1. **Crea cuenta** en https://heroku.com
2. **Instala Heroku CLI**
3. **En la carpeta del proyecto**:
   ```bash
   heroku create bazar-el-romero
   git init
   git add .
   git commit -m "Initial commit"
   heroku config:set JWT_SECRET=tu_clave_secreta
   heroku config:set ADMIN_USERNAME=tu_usuario
   heroku config:set ADMIN_PASSWORD=tu_contraseña
   git push heroku main
   ```
4. **Accede a**: `https://bazar-el-romero.herokuapp.com`

### **Vercel (Gratis)**
1. **Crea cuenta** en https://vercel.com
2. **Conecta tu proyecto** de GitHub
3. **Configura variables** de entorno en el dashboard
4. **Despliega automáticamente**

---

## 📞 **SOPORTE PARA EL DUEÑO**

### **Cambiar Contraseña de Administrador**
1. **Inicia sesión** en el panel de administración
2. **Click en "🔑 Cambiar Contraseña"**
3. **Introduce** la contraseña actual y la nueva
4. **Confirma** el cambio

### **Respaldar Productos**
1. **En el panel de administración**
2. **Click "💾 Exportar a JSON"**
3. **Guarda** el archivo en lugar seguro
4. **Para restaurar**: "📥 Importar Excel" y selecciona el archivo

### **Cambiar Información de Contacto**
- **Número de WhatsApp**: Edita la variable en `index.html` línea 290
- **Logo**: Reemplaza `logofrank.jpg` con tu logo
- **Colores**: Modifica las variables CSS en `:root`

---

## 🛡️ **MEDIDAS DE SEGURIDA**

### **Para el Desarrollador:**
- ✅ **Cambia credenciales por defecto** antes del despliegue
- ✅ **Configura ALLOWED_ORIGINS** con tu dominio real
- ✅ **Usa HTTPS** en producción
- ✅ **Respaldar regularmente** la base de datos

### **Para el Dueño de la Tienda:**
- 🔐 **No compartas** las credenciales de administrador
- 💾 **Haz respaldos** de tus productos regularmente
- 🔄 **Cambia contraseña** cada 6 meses
- 📱 **Accede desde dispositivos seguros**

---

## ❓ **PREGUNTAS FRECUENTES**

### **¿Puedo acceder desde otro país?**
Sí, siempre que tengas el servidor accesible desde internet y configures las variables de entorno correctamente.

### **¿Qué pasa si pierdo la contraseña?**
El desarrollador puede resetearla regenerando el archivo de usuarios.

### **¿Cuántos productos puedo tener?**
Prácticamente ilimitados. La aplicación está optimizada para manejar miles de productos.

### **¿Puedo cambiar los colores de la tienda?**
Sí, todos los estilos están en los archivos CSS y pueden ser modificados.

### **¿Funciona sin internet?**
La administración requiere internet, pero los clientes pueden navegar productos que ya estén cargados.

---

## 📧 **CONTACTO Y SOPORTE**

Para soporte técnico o modificaciones adicionales, contacta al desarrollador con:
- Descripción del problema
- Capturas de pantalla (si aplica)
- Pasos para reproducir el error

---

**¡Tu tienda online está lista para funcionar! 🚀**