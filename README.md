Backend API – Mini Proyecto 2

API REST del sistema de salas de estudio colaborativas desarrollado para el Mini Proyecto 2 de Proyecto Integrador.

Este servicio funciona como intermediario entre el frontend y Firebase (Authentication y Cloud Firestore). Recibe las solicitudes del cliente, verifica la sesión del usuario, consulta o guarda la información y devuelve respuestas en formato JSON.

Tecnologías

- Node.js 24
- TypeScript
- Express
- Firebase Admin SDK (Authentication y Firestore)
- Cloud Firestore
- Swagger / OpenAPI 3.0
- Docker y Docker Compose
- Render

Responsabilidades

- Exponer los endpoints REST del sistema.
- Verificar la sesión del usuario en cada petición privada (token de Firebase).
- Crear y consultar los perfiles de usuario, validando los datos en el servidor.
- Garantizar que el nombre de usuario sea único.
- Consultar y gestionar información almacenada en Firestore.
- Centralizar el acceso del frontend a la base de datos.
- Manejar errores de las solicitudes.
- Proporcionar documentación de la API mediante Swagger.

Importante: el frontend no debe conectarse directamente a Firestore. Las operaciones de acceso a datos se realizan a través de este backend.

Estructura del proyecto

backend-api/
├── src/
│   ├── config/
│   │   ├── firebase.ts
│   │   └── swagger.ts
│   ├── controllers/
│   │   ├── firestore.controller.ts
│   │   └── usuarios.controller.ts
│   ├── middlewares/
│   │   └── verificarToken.ts
│   ├── routes/
│   │   ├── firestore.routes.ts
│   │   └── usuarios.routes.ts
│   ├── services/
│   │   ├── firestore.service.ts
│   │   └── usuarios.service.ts
│   └── index.ts
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── docker-compose.yml
├── package.json
├── package-lock.json
└── tsconfig.json

La aplicación está organizada por responsabilidades:

- config: configuración de Firebase y Swagger.
- middlewares: verificación del token de sesión.
- controllers: validación de los datos y respuesta de las solicitudes HTTP.
- routes: definición de los endpoints y su documentación Swagger.
- services: lógica de acceso a Firestore.
- index.ts: configuración e inicio del servidor.

Requisitos previos

- Node.js 24 o compatible.
- npm.
- Docker Desktop.
- Un proyecto de Firebase con Authentication (correo y Google) y Cloud Firestore habilitados.
- Una identidad de servicio autorizada para acceder a Firebase.

Instalación y ejecución local

1. Clonar el repositorio:

git clone https://github.com/Miniproyecto-2-Proyecto-Integrador/backend-api.git
cd backend-api

2. Instalar las dependencias:

npm ci

3. Crear el archivo ".env" tomando como referencia ".env.example":

FIREBASE_PROJECT_ID=mini-proyecto-2
PORT=3000
API_URL=
GOOGLE_APPLICATION_CREDENTIALS=

4. Configurar la autenticación de Firebase Admin SDK.

Para desarrollo local se puede utilizar Application Default Credentials (ADC):

gcloud auth application-default login

También se puede utilizar una cuenta de servicio autorizada, configurando "GOOGLE_APPLICATION_CREDENTIALS" con la ruta local del archivo de credenciales.

Las credenciales deben mantenerse fuera del repositorio.

5. Iniciar el servidor en desarrollo:

npm run dev

El servidor estará disponible en:

"http://localhost:3000"

Variables de entorno

Variable| Descripción
"PORT"| Puerto en el que se ejecuta el servidor.
"FIREBASE_PROJECT_ID"| Identificador del proyecto de Firebase.
"API_URL"| URL pública de la API. Swagger la usa como servidor desplegado. Si está vacía, usa http://localhost:3000.
"GOOGLE_APPLICATION_CREDENTIALS"| Ruta del archivo de credenciales utilizado por Firebase Admin SDK.

La autenticación utiliza Application Default Credentials. En entornos Docker y Render se configura mediante una credencial externa, sin incorporarla a la imagen ni al repositorio.

Autenticación

Los endpoints privados exigen el token de Firebase del usuario con sesión iniciada, enviado en el encabezado:

Authorization: Bearer <token>

Si el encabezado falta, o el token no es válido o expiró, la API responde 401. En Swagger se puede probar con el botón "Authorize".

Firebase y Firestore

El backend utiliza Firebase Admin SDK para verificar sesiones y acceder a Cloud Firestore.

La configuración actual utiliza el proyecto "mini-proyecto-2" y una cuenta de servicio exclusiva para Backend API.

La cuenta de servicio dispone del rol "Cloud Datastore User", necesario para las operaciones de acceso a Firestore.

La base de datos utiliza la configuración de seguridad en modo de producción. El acceso administrativo se realiza mediante Firebase Admin SDK.

Colecciones utilizadas:

Colección| Documento| Contenido
"users"| uid del usuario| nombres, apellidos, username, avatar, correo, creadoEn.
"usernames"| username en minúsculas| uid del dueño. Garantiza que el nombre de usuario sea único (se escribe en una transacción junto con el perfil).
"pruebas"| libre| Datos de la base técnica.

Firebase Authentication (correo y Google) está habilitado en el proyecto; el backend solo verifica los tokens.

Endpoints disponibles

Método| Ruta| Acceso| Descripción
GET| "/"| Público| Verifica que el backend esté funcionando.
GET| "/api/pruebas"| Público| Consulta documentos de la colección "pruebas" en Firestore.
POST| "/api/usuarios"| Privado| Crea el perfil del usuario con sesión.
GET| "/api/usuarios/yo"| Privado| Devuelve el perfil del usuario con sesión.
GET| "/api-docs"| Público| Accede a la documentación Swagger.

Ejemplo de respuesta

Al consultar "GET /api/pruebas", el servicio devuelve una respuesta JSON con el resultado de la consulta:

{
  "success": true,
  "data": [
    {
      "id": "prueba-01",
      "nombre": "Mini Proyecto 2",
      "mensaje": "Conexión exitosa con Firestore",
      "estado": "activo"
    }
  ]
}

El contenido depende de los documentos almacenados en la colección.

POST /api/usuarios

Cuerpo (JSON):

{
  "nombres": "Samuel",
  "apellidos": "Banguero",
  "username": "samuel_b",
  "avatar": "avatar1"
}

El correo se toma del token, no del cuerpo.

Validaciones en el servidor:

- nombres y apellidos: obligatorios, máximo 50 caracteres.
- username: de 3 a 20 caracteres (letras, números o guion bajo). Único, sin distinguir mayúsculas.
- avatar: obligatorio.

Respuestas:

Código| Significado
201| Perfil creado.
400| Datos inválidos (devuelve los errores por campo).
401| Sin sesión o token inválido.
409| Nombre de usuario ya en uso, o el usuario ya tiene perfil.
500| Error del servidor.

Ejemplo de error 409:

{
  "success": false,
  "message": "Ese nombre de usuario ya está en uso.",
  "errores": { "username": "Ese nombre de usuario ya está en uso. Prueba con otro." }
}

GET /api/usuarios/yo

Devuelve el perfil del usuario con sesión (nombres, apellidos, username, avatar, correo y creadoEn).

Si el usuario inició sesión pero aún no tiene perfil (por ejemplo, entró con Google y no ha elegido su nombre de usuario), responde 404; el frontend usa esa respuesta para llevarlo a elegir su nombre de usuario.

Construcción y ejecución con Docker

El proyecto utiliza Docker multi-stage para separar la etapa de compilación de la etapa de ejecución.

Para construir y levantar el servicio:

docker compose up --build -d

Para consultar el estado del contenedor:

docker ps

Para consultar los registros:

docker compose logs -f

Para detener el servicio:

docker compose down

Docker Compose utiliza el archivo ".env" y monta las credenciales de Google como un archivo externo de solo lectura. Las credenciales no se copian a la imagen Docker.

Nota: este docker-compose.yml levanta solo el backend. <Indicar dónde está el compose que levanta frontend y backend juntos.>

Despliegue en Render

El backend API se despliega en Render mediante Docker.

La configuración del servicio utiliza las siguientes variables de entorno:

- "FIREBASE_PROJECT_ID"
- "API_URL" (URL pública del servicio)
- "GOOGLE_APPLICATION_CREDENTIALS"

Las credenciales de Firebase se proporcionan mediante un Secret File de Render. La variable "GOOGLE_APPLICATION_CREDENTIALS" apunta a la ruta del archivo montado por Render.

El archivo de credenciales no se almacena en GitHub ni se incorpora a la imagen Docker.

Pruebas locales

Verificar el estado del servidor:

"http://localhost:3000/"

Consultar Firestore:

"http://localhost:3000/api/pruebas"

Consultar la documentación:

"http://localhost:3000/api-docs"

Compilación

Para comprobar que el código TypeScript compila correctamente:

npm run build

Consideraciones de seguridad

- No subir archivos ".env" al repositorio.
- No publicar claves privadas ni archivos de credenciales.
- Mantener ".env.example" sin valores sensibles.
- Utilizar credenciales con los permisos mínimos necesarios.
- Excluir credenciales y variables locales mediante ".gitignore" y ".dockerignore".
- No incorporar credenciales dentro de las imágenes Docker.
- Validar siempre los datos y la sesión en el servidor, no solo en la pantalla.
- Centralizar el acceso del frontend a Firestore mediante el backend API.

Estado del servicio

Sprint 0: base técnica (conexión con Firestore, endpoint de consulta, Swagger y Docker).
Sprint 1: autenticación y usuarios (verificación de sesión, creación y consulta de perfil, nombre de usuario único).

Los nuevos endpoints se agregarán en los siguientes sprints.