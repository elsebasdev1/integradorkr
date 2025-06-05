# 🏥 Sistema de Citas Médicas

Este es un sistema web completo de **gestión de citas médicas** desarrollado con tecnologías modernas, diseñado para facilitar la interacción entre pacientes y profesionales de la salud. Ofrece una interfaz clara, fluida y responsive para agendar, administrar y gestionar citas médicas en tiempo real.

## 📸 Capturas

![Vista del Dashboard](https://user-images.githubusercontent.com/PatientDashboard.png)
![Vista del Dashboard](https://user-images.githubusercontent.com/AdminDashboard.png)

## 🚀 Tecnologías Utilizadas

- **Frontend:** [React](https://reactjs.org/) + [Tailwind CSS](https://tailwindcss.com/)
- **Backend & Hosting:** [Firebase](https://firebase.google.com/)
- **Routing:** React Router DOM
- **Autenticación:** Firebase Authentication (Google Sign-In)
- **Base de datos:** Firestore (NoSQL tiempo real)
- **Otros:**
  - Vite (entorno de desarrollo)
  - Framer Motion (animaciones)
  - React Hot Toast (notificaciones)
  - Date-fns (manejo de fechas)

## 🎯 Objetivos del Proyecto

- Agendar, confirmar, cancelar o modificar citas médicas.
- Gestión de especialidades, médicos y usuarios.
- Experiencia de usuario fluida y moderna.
- Roles diferenciados: paciente y administrador.
- Despliegue estable y en tiempo real con Firebase.

## 📁 Estructura del Proyecto

```
src/
│
├── components/         # Componentes reutilizables
├── pages/              # Vistas principales por rol
├── contexts/           # Contexto de autenticación
├── utils/              # Utilidades varias
├── assets/             # Recursos estáticos
```

## 🧑‍💻 Funcionalidades Principales

- **Paciente:**
  - Agendar citas por especialidad y médico
  - Editar o cancelar citas
  - Editar su perfil
- **Administrador:**
  - Confirmar o descartar citas pendientes
  - Gestionar usuarios, médicos y especialidades
  - Cambiar roles entre paciente y administrador

## 📦 Instalación Local

1. Clona el repositorio:

   ```bash
   git clone https://github.com/elsebasdev1/integradorkr.git
   cd integradorkr
   ```

2. Instala dependencias:

   ```bash
   npm install
   ```

3. Configura Firebase:

   - Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
   - Habilita Firestore, Authentication (Google), y Hosting
   - Agrega tu archivo de configuración en `.env.local` o directamente en `firebase.js`

4. Ejecuta en desarrollo:

   ```bash
   npm run dev
   ```

5. Para desplegar:

   ```bash
   npm run build
   firebase deploy
   ```

## 🛡️ Seguridad y Validaciones

- Rutas protegidas con `PrivateRoute` y control por rol.
- Validaciones de formularios antes de interactuar con Firestore.
- Protección para evitar eliminación de especialidades/médicos en uso.
- Confirmaciones visuales y notificaciones accesibles.

## 📘 Documentación

- [Informe Técnico del Proyecto](./Informe%20Citas%20Medicas.pdf)
- [Manual de Usuario](./Manual%20de%20Usuario%20Citas%20Medicas.pdf)

## ✅ Buenas Prácticas Aplicadas

- Código modular y reutilizable
- Hooks personalizados
- Separación clara entre lógica de negocio y presentación
- Feedback constante al usuario (toasts, loaders, animaciones)

## 📌 Estado del Proyecto

✅ Proyecto finalizado y funcional.  
🚧 Posibilidad de integrar nuevas funcionalidades (ej. recordatorios por correo, historial médico, etc.).

## 📄 Licencia

Este proyecto se entrega bajo la licencia MIT. Puedes usarlo, modificarlo y compartirlo libremente.

---

> Desarrollado con ❤️ por Kevin Sebastián Sinchi Naula - Rafael Santiago Serrano Mora – 2025
