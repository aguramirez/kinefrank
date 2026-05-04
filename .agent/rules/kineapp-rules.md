---
trigger: always_on
---

# Reglas del Proyecto: KineAppFrank (Kinesiología Digital)

## Descripción General
Webapp responsive (Mobile First) diseñada para profesionales de la kinesiología. Permite la gestión de pacientes, creación y asignación de rutinas de ejercicios, y seguimiento de diagnósticos. Existen dos tipos de usuarios principales: **Admin** (Kinesiólogo) y **Paciente**.

## Contexto Tecnológico
- **Stack:** Next.js 14+ (App Router), TypeScript, Prisma ORM, PostgreSQL, Tailwind CSS (Mobile First).
- **Despliegue:** Vercel y Neon
- **Autenticación:** NextAuth.js o Middleware personalizado basado en DNI (Pacientes) y Credenciales (Admin).
- **Almacenamiento de Archivos:** Subir los videos de cada ejercicio a Cloudinary.

## Estándares de UI/UX
- **Mobile First:** Priorizar componentes táctiles y legibilidad en smartphones.
- **Navegación Admin:** Bottom nav o Sidebar colapsable.
- **Navegación Paciente:** Home simplificada con botón prominente "Terminar Sesión".

## Roles de Usuario y Vistas

### 1. Perfil Admin
El administrador tiene control total sobre las entidades principales.
- **Atributos:** Nombre completo, Email, DNI, Password, Username.
- **Vistas y Funcionalidades:**
  - **Dashboard:** Información resumida (cantidad de pacientes activos, pacientes que entrenaron hoy, gráficos de progreso).
  - **Pacientes:** CRUD de pacientes.
  - **Ejercicios:** CRUD de ejercicios (crear ejercicio con nombre, descripción y video).
  - **Rutinas:** CRUD de rutinas y días. Una rutina incluye un nombre, descripción y días. Cada día es un conjunto de ejercicios con *sets*, *reps* y *tiempo*.
  - **Diagnósticos:** Gestión de diagnósticos del sistema.

### 2. Perfil Paciente
Vista simplificada para que el paciente acceda a sus rutinas.
- **Atributos:** Nombre completo, DNI, Teléfono, Email, Género, Edad, Altura, Peso, Notas, Cantidad de sesiones, Obra social, Total facturado, Total cobrado, Diferencia, Alta (estado), Diagnóstico[], SPADI json.
- **Vistas y Funcionalidades:**
  - **Login:** Acceso únicamente utilizando su DNI.
  - **Home:** Progreso de sesiones, visualización de su rutina asignada (días y ejercicios) y botón de "Terminar Sesión".

## Especificaciones y Reglas de Negocio Críticas

1. **Gestión de Diagnósticos ("Create or Select"):**
   - El campo diagnóstico en pacientes es un array de strings (`String[]`).
   - El admin puede crear diagnósticos interactuando con un *input select*. Si el diagnóstico no existe, se crea escribiéndolo como un input de texto, se vincula automáticamente al paciente actual y queda documentado para futuros pacientes. Un paciente puede tener múltiples diagnósticos (ej. "Dolor de hombro", "Movilidad reducida en escápula").

2. **Cálculo Financiero de Pacientes:** 
   - `difference` = `totalInvoiced` - `totalPaid`.
   - Estos campos no se llenan obligatoriamente al crear, sino que al dar de alta al paciente aparece un formulario con los inputs para llenarlos. Esto servirá para la generación de un informe PDF.

3. **Acceso Post-Alta (Gestión de Alta Automática o Manual):**
   - Boolean para categorizar al paciente como activo (`isActive`).
   - El admin puede elegir de antemano cuántos días más podrá acceder el paciente al sistema tras ser dado de alta (`dischargeDate`). Si la fecha actual sobrepasa dicha fecha límite, el paciente perderá el acceso a su rutina y al intentar loguearse verá un mensaje de denegación.

4. **SPADI (Índice de Dolor y Discapacidad):**
   - Se guarda como un objeto JSON persistido que incluye 16 parámetros numéricos evaluados del 0 al 10 (ej. *espm, csasel, aaaeuea, atlppdsc, aeceba, lep, lle, pucouj, pucclbd, plp, cuoeuea, cuopd4k, cadsbt, tps, tds, tss*), para facilitar la escalabilidad.

## Modelos de Datos (Prisma Schema)

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Admin {
  id        String   @id @default(uuid())
  fullName  String
  email     String   @unique
  dni       String   @unique
  password  String
  username  String   @unique
  createdAt DateTime @default(now())
}

model Paciente {
  id             String    @id @default(uuid())
  fullName       String
  dni            String    @unique
  phone          String
  email          String
  gender         String
  age            Int
  height         Float
  weight         Float
  notes          String?
  sessionsCount  Int       @default(0)
  healthInsurance String
  totalInvoiced  Float     @default(0)
  totalPaid      Float     @default(0)
  difference     Float     @default(0) // Calculado aut. antes de guardar
  isActive       Boolean   @default(true)
  dischargeDate  DateTime? // Límite de acceso post-alta
  diagnoses      String[]  // Array de strings para almacenar diagnósticos
  spadi          Json      // Objeto JSON con los 16 parámetros (0-10)
  createdAt      DateTime  @default(now())
  rutinas        Rutina[]
}

model Ejercicio {
  id          String   @id @default(uuid())
  name        String
  description String
  videoUrl    String?
  createdAt   DateTime @default(now())
}

model Rutina {
  id          String   @id @default(uuid())
  name        String
  description String
  dias        Dia[]
  pacienteId  String?
  paciente    Paciente? @relation(fields: [pacienteId], references: [id])
  createdAt   DateTime @default(now())
}

model Dia {
  id         String            @id @default(uuid())
  name       String
  rutinaId   String
  rutina     Rutina            @relation(fields: [rutinaId], references: [id])
  ejercicios EjercicioEnDia[]
  createdAt  DateTime          @default(now())
}

model EjercicioEnDia {
  id         String    @id @default(uuid())
  diaId      String
  dia        Dia       @relation(fields: [diaId], references: [id])
  exerciseId String
  sets       Int
  reps       Int
  time       String?
  createdAt  DateTime  @default(now())
}
```

## Notas sobre el Diseño
- **SPADI como JSON:** La base de datos guarda este índice en formato JSON dentro de Prisma. Te permite enviar y recibir el objeto completo con sus 16 parámetros directamente desde el frontend sin crear múltiples columnas.
- **Diagnósticos:** PostgreSQL soporta arrays de Strings (`String[]`). El administrador puede manejar dinámicamente el array de diagnósticos como texto.
- **Cálculo de difference:** Aunque el campo exista en la base de datos, tu lógica de backend siempre debe asegurar la ejecución de `difference = totalInvoiced - totalPaid` previo a guardarlo en la DB.
- **Relaciones:** Se añadió `pacienteId` en el modelo **Rutina** debido a que toda rutina pertenece típicamente a un paciente específico.

## Ejemplos de Entidades (JSON)

### JSON de Ejemplo: Paciente
```json
{
  "fullName": "Juan Pérez",
  "dni": "99888777",
  "diagnoses": ["Dolor de hombro", "Movilidad reducida escapular"],
  "spadi": {
    "espm": 5, "csasel": 2, "aaaeuea": 8, "atlppdsc": 4, 
    "aeceba": 0, "lep": 3, "lle": 7, "pucouj": 1, 
    "pucclbd": 5, "plp": 2, "cuoeuea": 9, "cuopd4k": 4, 
    "cadsbt": 6, "tps": 3, "tds": 2, "tss": 5
  },
  "isActive": true,
  "sessionsCount": 10,
  "totalInvoiced": 50000,
  "totalPaid": 35000,
  "difference": 15000
}
```

### JSON de Ejemplo: Rutina y Días
```json
{
  "name": "Rehabilitación Manguito Rotador",
  "days": [
    {
      "dayName": "Lunes - Movilidad",
      "exercises": [
        {
          "exercise": { 
             "name": "Vuelos laterales", 
             "video": "https://res.cloudinary.com/demo/video/upload/sample.mp4" 
          },
          "sets": 3,
          "reps": 12,
          "time": "45s"
        }
      ]
    }
  ]
}
```