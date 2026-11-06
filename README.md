Backend API – Mini Proyecto 2

API REST del sistema de salas de estudio colaborativas desarrollado para el Mini Proyecto 2 de Proyecto Integrador.

Este servicio funciona como intermediario entre el frontend y Firebase Cloud Firestore. Recibe las solicitudes del cliente, consulta la información almacenada y devuelve respuestas en formato JSON.

Tecnologías

- Node.js 24
- TypeScript
- Express
- Firebase Admin SDK
- Cloud Firestore
- Swagger / OpenAPI 3.0
- Docker y Docker Compose
- Render

Responsabilidades

- Exponer los endpoints REST del sistema.
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
│   ├── routes/
│   ├── services/
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
- controllers: recepción y respuesta de las solicitudes HTTP.
- routes: definición de los endpoints.
- services: lógica de acceso a Firestore.
- index.ts: configuración e inicio del servidor.

Requisitos previos

- Node.js 24 o compatible.
- npm.
- Docker Desktop.
- Un proyecto de Firebase con Cloud Firestore habilitado.
- Una identidad de servicio autorizada para acceder a Firestore.

Instalación y ejecución local

1. Clonar el repositorio:

git clone https://github.com/Miniproyecto-2-Proyecto-Integrador/backend-api.git
cd backend-api

2. Instalar las dependencias:

npm ci

3. Crear el archivo ".env" tomando como referencia ".env.example":

FIREBASE_PROJECT_ID=mini-proyecto-2
PORT=3000
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
"GOOGLE_APPLICATION_CREDENTIALS"| Ruta del archivo de credenciales utilizado por Firebase Admin SDK.

La autenticación utiliza Application Default Credentials. En entornos Docker y Render se configura mediante una credencial externa, sin incorporarla a la imagen ni al repositorio.

Firebase y Firestore

El backend utiliza Firebase Admin SDK para acceder a Cloud Firestore.

La configuración actual utiliza el proyecto "mini-proyecto-2" y una cuenta de servicio exclusiva para Backend API.

La cuenta de servicio dispone del rol "Cloud Datastore User", necesario para las operaciones de acceso a Firestore.

La base de datos utiliza la configuración de seguridad en modo de producción. El acceso administrativo se realiza mediante Firebase Admin SDK.

Endpoints disponibles

Método| Ruta| Descripción
GET| "/"| Verifica que el backend esté funcionando.
GET| "/api/pruebas"| Consulta documentos de la colección "pruebas" en Firestore.
GET| "/api-docs"| Accede a la documentación Swagger.

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

Despliegue en Render

El backend API se despliega en Render mediante Docker.

La configuración del servicio utiliza las siguientes variables de entorno:

- "FIREBASE_PROJECT_ID"
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
- Centralizar el acceso del frontend a Firestore mediante el backend API.

Estado del servicio

La arquitectura base del backend API se encuentra implementada. Incluye conexión con Firestore, endpoint de consulta, manejo de errores, documentación Swagger y configuración para ejecución mediante Docker y Docker Compose.

La implementación de nuevos endpoints y funcionalidades se ampliará durante las siguientes sprints.
