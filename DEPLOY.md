# ObservadorUriel — Guía de Deploy

## Estructura del proyecto

```
ObservadorUriel/
├── backend/        ← FastAPI → Railway
└── frontend/       ← React/Vite → Netlify
```

---

## PASO 1 — Subir a GitHub

```bash
cd "ObservadorUriel"
git init
git add .
git commit -m "ObservadorUriel - deploy inicial"
git branch -M main
git remote add origin https://github.com/TU_USUARIO/observador-uriel.git
git push -u origin main
```

---

## PASO 2 — Backend en Railway

### 2.1 Crear proyecto en Railway

1. Ve a https://railway.app → **New Project**
2. Elige **Deploy from GitHub repo** → selecciona `observador-uriel`
3. Railway detecta automáticamente el `railway.toml` en `/backend`

   > Si Railway no detecta el backend, configura manualmente:
   > - **Root Directory:** `backend`
   > - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### 2.2 Agregar PostgreSQL

1. En tu proyecto Railway → **+ New** → **Database** → **Add PostgreSQL**
2. Railway vincula automáticamente la variable `DATABASE_URL`

### 2.3 Variables de entorno en Railway

En la sección **Variables** del servicio backend, agrega:

| Variable       | Valor                        |
|----------------|------------------------------|
| `SECRET_KEY`   | una clave larga y aleatoria  |
| `ALGORITHM`    | `HS256`                      |

Para generar `SECRET_KEY` puedes usar:
```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

### 2.4 Obtener la URL del backend

Una vez desplegado, Railway te da una URL tipo:
```
https://observador-uriel-production.up.railway.app
```
**Guarda esta URL**, la necesitas para el paso 3.

---

## PASO 3 — Frontend en Netlify

### 3.1 Crear archivo .env en frontend (solo local)

```bash
cd frontend
cp .env.example .env
```

Edita `.env`:
```
VITE_API_URL=https://observador-uriel-production.up.railway.app
```

### 3.2 Conectar Netlify con GitHub

1. Ve a https://netlify.com → **Add new site** → **Import from Git**
2. Elige tu repo `observador-uriel`
3. Netlify detecta el `netlify.toml` en la raíz. Verifica:
   - **Base directory:** `frontend`
   - **Build command:** `npm run build`
   - **Publish directory:** `frontend/dist`

### 3.3 Variable de entorno en Netlify

En **Site settings → Environment variables → Add variable**:

| Key             | Value                                                          |
|-----------------|----------------------------------------------------------------|
| `VITE_API_URL`  | `https://observador-uriel-production.up.railway.app`          |

### 3.4 Deploy

Haz clic en **Deploy site**. Netlify construye e instala automáticamente.

---

## PASO 4 — Configurar CORS en Railway

Una vez tengas la URL de Netlify (ej: `https://observador-uriel.netlify.app`), agrega esta variable en Railway:

| Variable        | Valor                                          |
|-----------------|------------------------------------------------|
| `FRONTEND_URL`  | `https://observador-uriel.netlify.app`         |

El `main.py` ya usa esta variable para los orígenes permitidos de CORS.

---

## Credenciales iniciales

| Usuario       | Documento    | Contraseña     | Rol   |
|---------------|-------------|----------------|-------|
| Alexander P.  | `admin`     | `docente2026`  | admin |
| David Salazar | `rector`    | `rector2026`   | admin |
| Coordinación  | `coord`     | `coord2026`    | coordinador |

> **Importante:** Cambia las contraseñas después del primer ingreso. El admin puede crear nuevos docentes desde la sección **Docentes** en el panel.

---

## Primer ingreso — Verificar que funciona

1. Entra a tu URL de Netlify
2. Inicia sesión con `admin` / `docente2026`
3. Ve a **Estudiantes** → deberías ver los 124 estudiantes cargados
4. Haz clic en un estudiante → **Nueva Anotación** → llena el formulario
5. Verifica que aparece el protocolo sugerido
6. Si el acudiente tiene teléfono, verifica que aparece el botón de WhatsApp

---

## Solución de problemas comunes

### Error 500 / "Internal Server Error"
- Verifica que `DATABASE_URL` está configurada en Railway
- Revisa los logs del servicio en Railway

### Error CORS (blocked by CORS policy)
- Verifica que `FRONTEND_URL` en Railway tiene exactamente la misma URL que Netlify (sin `/` al final)
- Redesplega el backend después de cambiar la variable

### Página en blanco en Netlify
- Verifica que `VITE_API_URL` está configurada en las variables de entorno de Netlify
- Reconstruye el site desde Netlify

### WhatsApp no abre el mensaje
- El teléfono del acudiente debe estar registrado en la ficha del estudiante
- El número debe ser colombiano (10 dígitos sin +57)
