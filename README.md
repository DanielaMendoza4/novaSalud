# Nova Salud — Sistema de Botica e Inventario

Aplicación web tipo SPA para la gestión de una botica/farmacia: panel de control, inventario, punto de venta (POS), clientes, alertas y reportes. Está construida con **React 19 + Vite 8** y actualmente funciona con **datos simulados en el cliente** (sin backend ni base de datos).

El desarrollo sigue los lineamientos del documento [`Documento_de_trabajo/trabajoPlan.pdf`](Documento_de_trabajo/trabajoPlan.pdf).

![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite&logoColor=white)
![React Router](https://img.shields.io/badge/React_Router-7-CA4245?logo=reactrouter&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?logo=bootstrap&logoColor=white)
![Estado](https://img.shields.io/badge/estado-en_desarrollo-f59e0b)

---

## Tabla de contenidos

- [Descripción general](#descripción-general)
- [Características actuales](#características-actuales)
- [Stack tecnológico](#stack-tecnológico)
- [Requisitos previos](#requisitos-previos)
- [Instalación y ejecución](#instalación-y-ejecución)
- [Scripts disponibles](#scripts-disponibles)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Arquitectura](#arquitectura)
- [Rutas de la aplicación](#rutas-de-la-aplicación)
- [Inicio de sesión y roles](#inicio-de-sesión-y-roles)
- [Catálogo de componentes](#catálogo-de-componentes)
- [Hooks](#hooks)
- [Sistema de diseño](#sistema-de-diseño)
- [Datos simulados](#datos-simulados)
- [Estado actual y limitaciones](#estado-actual-y-limitaciones)
- [Próximos pasos](#próximos-pasos)
- [Solución de problemas](#solución-de-problemas)
- [Despliegue en producción](#despliegue-en-producción)
- [Convenciones de desarrollo](#convenciones-de-desarrollo)
- [Licencia](#licencia)

---

## Descripción general

Nova Salud es el frontend de un sistema integral de gestión farmacéutica. La aplicación ofrece:

- Un **dashboard** con indicadores clave (ventas del día, stock bajo, próximos vencimientos y total de inventario).
- Una **tabla de inventario** con búsqueda por nombre o código y acciones de reposición.
- Un **modal de punto de venta** y otro de **registro de producto**, con notificaciones tipo *toast*.
- Un **login** con accesos diferenciados para usuario operativo y administrador.
- Un **layout responsive** compuesto por barra lateral, barra superior, área de contenido y pie de página.
- Navegación por módulos con visibilidad y protección según el rol.

> **Importante:** esta versión es una maqueta funcional. Los productos, alertas y la sesión de usuario son simulados; no existen llamadas a una API ni persistencia en base de datos.

---

## Características actuales

### Implementadas

- Dashboard con banner principal, tarjetas KPI y tabla de inventario.
- Login con pestañas de **Usuario** y **Administrador**, validación de credenciales y sesión persistente.
- Protección de rutas por sesión y por rol, además del filtrado del menú lateral.
- POS de ventas con carrito, control de stock, comprobantes, medios de pago e historial por trabajador.
- Directorio de clientes con búsqueda, filtros, paginación, ficha de compras y administración restringida al rol admin.
- Estado en memoria compartido para productos, clientes, ventas y alertas.
- Búsqueda en tiempo real de medicamentos por nombre o código.
- Modal reutilizable para:
  - Simulación de venta rápida (subtotal, IGV, total y método de pago).
  - Registro de nuevo producto (formulario de demostración).
- Notificaciones *toast* con autocierre (4 segundos por defecto).
- Barra lateral colapsable en escritorio y deslizable en móvil.
- Menú filtrado según el rol del usuario (`admin`, `vendedor`, `almacen`).
- Campana de alertas con contador, lista desplegable y cierre al hacer clic fuera.
- Autenticación simulada con persistencia en `localStorage` y logout funcional.
- Diseño responsive con paleta médica y tipografía Plus Jakarta Sans.
- Build de producción y lint configurados.

### En desarrollo / solo demostración

- Inventario, Alertas y Reportes todavía muestran páginas de marcador de posición.
- No hay backend, API, base de datos ni pruebas automatizadas.
- La autenticación es simulada en el cliente; las cuentas demo viven en `src/data/usuarios.js`.
- La búsqueda de la barra superior solo imprime en consola.

---

## Stack tecnológico

| Tecnología | Versión declarada | Uso en el proyecto |
| --- | --- | --- |
| [React](https://react.dev/) | `^19.2.8` (instalado 19.3.1) | Biblioteca de interfaz y componentes |
| [React DOM](https://react.dev/) | `^19.2.8` (instalado 19.3.1) | Renderizado en el navegador |
| [Vite](https://vite.dev/) | `^8.3.0` (instalado 8.3.4) | Servidor de desarrollo y empaquetado |
| [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react) | `^6.1.1` | Soporte de React con Fast Refresh |
| [React Router DOM](https://reactrouter.com/) | `^7.18.4` | Enrutamiento SPA (`BrowserRouter`, `Routes`, `NavLink`) |
| [Bootstrap](https://getbootstrap.com/) | `^5.3.8` | Reset y estilos base importados globalmente |
| [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) | `^1.81.0` | Linter de JavaScript/React |
| CSS puro | — | Estilos por componente y tokens de diseño globales |

**No se utiliza:** TypeScript, Tailwind, Redux/Zustand, backend, base de datos ni framework de pruebas.

---

## Requisitos previos

- **Node.js** `^20.19.0` o `>=22.12.0` (requisito de Vite 8). Recomendado: Node.js 22 LTS o superior.
- **npm** 10 o superior (el proyecto incluye `package-lock.json`).
- Un navegador moderno (Chrome, Edge, Firefox o Safari recientes).
- Opcional: Git para control de versiones.

Verifica tu entorno:

```powershell
node -v
npm -v
```

> Laragon/Apache **no es necesario** para ejecutar la aplicación en desarrollo. Vite levanta su propio servidor.

---

## Instalación y ejecución

1. Ubícate en la carpeta del proyecto:

   ```powershell
   cd C:\laragon\www\app-novasalud
   ```

2. Instala las dependencias:

   ```powershell
   npm install
   ```

3. Inicia el servidor de desarrollo:

   ```powershell
   npm run dev
   ```

4. Abre en el navegador la URL que muestra la terminal:

   ```
   http://localhost:5173
   ```

   Si el puerto está ocupado, Vite usará otro (por ejemplo `5174`) o puedes indicarlo manualmente:

   ```powershell
   npm run dev -- --port 5174
   ```

> **No abras `index.html` con doble clic** ni lo sirvas directamente con Apache/Laragon. Es una aplicación React con módulos ES y JSX: necesita el servidor de Vite (o un build servido correctamente).

### Primer uso

Al abrir la aplicación sin sesión, se redirige automáticamente a `/login`. Usa una de estas cuentas de demostración:

| Tipo de acceso | Correo | Contraseña | Rol |
| --- | --- | --- | --- |
| Usuario | `vendedor@novasalud.pe` | `usuario123` | `vendedor` |
| Administrador | `admin@novasalud.pe` | `admin123` | `admin` |

- La pestaña seleccionada debe coincidir con el tipo de cuenta.
- La sesión se guarda en `localStorage` bajo las claves `novasalud_usuario` y `novasalud_token`.
- La contraseña **no** se almacena en el navegador.
- Puedes limpiar la sesión desde la consola del navegador:

  ```js
  localStorage.removeItem('novasalud_usuario')
  localStorage.removeItem('novasalud_token')
  location.href = '/login'
  ```

> Las claves antiguas `usuario` y `token` se eliminan automáticamente para forzar el nuevo flujo de login.

---

## Scripts disponibles

| Comando | Descripción |
| --- | --- |
| `npm run dev` | Inicia el servidor de desarrollo con HMR en `http://localhost:5173`. |
| `npm run build` | Genera el build optimizado de producción en `dist/`. |
| `npm run preview` | Sirve localmente el contenido de `dist/` para verificar el build. |
| `npm run lint` | Ejecuta Oxlint sobre el proyecto. |

Ejemplo de verificación completa:

```powershell
npm run lint
npm run build
npm run preview
```

---

## Estructura del proyecto

```text
app-novasalud/
├── Documento_de_trabajo/
│   └── trabajoPlan.pdf          # Plan de trabajo que guía el desarrollo
├── public/
│   ├── favicon.svg              # Icono alternativo (no referenciado actualmente)
│   └── icons.svg                # Sprite de iconos (no referenciado actualmente)
├── src/
│   ├── assets/
│   │   ├── hero.png             # Recurso no utilizado
│   │   ├── react.svg            # Recurso no utilizado
│   │   └── vite.svg             # Recurso no utilizado
│   ├── components/              # Un componente por carpeta (JSX + CSS)
│   │   ├── AlertBell/
│   │   │   ├── AlertBell.jsx
│   │   │   └── AlertBell.css
│   │   ├── Badge/
│   │   │   ├── Badge.jsx
│   │   │   └── Badge.css
│   │   ├── Button/
│   │   │   ├── Button.jsx
│   │   │   └── Button.css
│   │   ├── Card/
│   │   │   ├── Card.jsx
│   │   │   └── Card.css
│   │   ├── Layout/
│   │   │   ├── Layout.jsx
│   │   │   └── Layout.css
│   │   ├── Login/
│   │   │   ├── Login.jsx
│   │   │   └── Login.css
│   │   ├── Modal/
│   │   │   ├── Modal.jsx
│   │   │   └── Modal.css
│   │   ├── Navbar/
│   │   │   ├── Navbar.jsx
│   │   │   └── Navbar.css
│   │   ├── ProtectedRoute/
│   │   │   ├── ProtectedRoute.jsx
│   │   │   └── ProtectedRoute.css
│   │   ├── SearchBar/
│   │   │   ├── SearchBar.jsx
│   │   │   └── SearchBar.css
│   │   ├── Sidebar/
│   │   │   ├── Sidebar.jsx
│   │   │   └── Sidebar.css
│   │   ├── Table/
│   │   │   ├── Table.jsx
│   │   │   └── Table.css
│   │   └── Toast/
│   │       ├── Toast.jsx
│   │       └── Toast.css
│   ├── context/
│   │   ├── AuthContext.js       # createContext + reexportaciones
│   │   ├── AuthProvider.jsx     # Proveedor de sesión simulada
│   │   ├── useAuth.js           # Hook de acceso al contexto
│   │   ├── DatosContext.js      # Contexto de datos compartidos
│   │   ├── DatosContext.jsx    # Proveedor de productos, clientes, ventas y alertas
│   │   ├── useDatos.js          # Hooks de lectura del estado compartido
│   │   └── index.js             # Barrel file del contexto
│   ├── pages/
│   │   ├── Ventas/
│   │   │   ├── Ventas.jsx
│   │   │   └── Ventas.css
│   │   └── Clientes/
│   │       ├── Clientes.jsx
│   │       └── Clientes.css
│   ├── data/
│   │   ├── usuarios.js          # Cuentas demo de acceso
│   │   ├── productos.js         # Catálogo de productos
│   │   ├── clientes.js          # Clientes de muestra
│   │   └── ventas.js            # Ventas de muestra
│   ├── hooks/
│   │   └── useAlertas.js        # Estado y acciones de alertas
│   ├── App.jsx                  # Vistas, rutas y composición principal
│   ├── App.css                  # Estilos del dashboard
│   ├── index.css                # Tokens de diseño y estilos globales
│   └── main.jsx                 # Punto de entrada de React
├── index.html                   # Documento HTML base
├── package.json                 # Dependencias y scripts
├── package-lock.json            # Árbol de dependencias bloqueado
├── vite.config.js               # Configuración de Vite
├── .oxlintrc.json               # Reglas del linter
├── .gitignore
└── README.md
```

> Las carpetas `node_modules/` y `dist/` están excluidas del repositorio mediante `.gitignore`.

### Mapa de archivos y responsabilidades

| Ruta | Responsabilidad |
| --- | --- |
| `src/main.jsx` | Punto de entrada: monta React, carga Bootstrap y los estilos globales. |
| `src/App.jsx` | Dashboard demo, definición de rutas, guards y composición general. |
| `src/App.css` | Estilos del dashboard (banner, KPIs y grilla de dos columnas). |
| `src/index.css` | Tokens de diseño, reset, tipografía y estilos globales. |
| `src/components/<Nombre>/` | Componentes de interfaz; cada uno con su `.jsx` y `.css`. |
| `src/components/Login/` | Pantalla de acceso con pestañas Usuario/Administrador. |
| `src/components/ProtectedRoute/` | Guard de sesión y roles para las rutas. |
| `src/context/` | `AuthContext`, `AuthProvider`, `useAuth` y su barrel. |
| `src/context/DatosContext.jsx` | Estado compartido en memoria para productos, clientes, ventas y alertas. |
| `src/pages/Ventas/` | POS, historial, comprobantes y operaciones del módulo de ventas. |
| `src/pages/Clientes/` | Directorio, formulario de administración e historial por cliente. |
| `src/data/usuarios.js` | Cuentas demo y tipos de acceso. |
| `src/data/productos.js` | Catálogo de productos y atributos de venta. |
| `src/data/clientes.js` | Clientes de demostración. |
| `src/data/ventas.js` | Ventas de demostración. |
| `src/hooks/useAlertas.js` | Alertas simuladas de stock y vencimientos. |
| `public/` | Recursos estáticos (`favicon.svg`, `icons.svg`). |
| `Documento_de_trabajo/` | Plan de trabajo original en PDF. |
| `package.json`, `vite.config.js`, `.oxlintrc.json` | Configuración de dependencias, build y lint. |

### Organización de componentes

Cada componente vive en su propia carpeta dentro de `src/components`, junto a su hoja de estilos:

```text
src/components/Login/
├── Login.jsx
└── Login.css
```

Los imports son directos, sin barrels ni árboles duplicados:

```jsx
import Layout from './components/Layout/Layout'
import Login from './components/Login/Login'
import Button from './components/Button/Button'
```

Esta organización sigue la misma lógica del proyecto `minimarket`: una carpeta por componente, estilos junto al JSX y datos simulados centralizados en `src/data`.

---

## Arquitectura

### Punto de entrada

`src/main.jsx` monta la aplicación en el elemento `#root` y carga los estilos globales:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import App from './App.jsx'
```

### Composición de la aplicación

```text
main.jsx
└── <App />
    └── <AuthProvider>              # Sesión simulada (localStorage)
        └── <DatosProvider>          # Productos, clientes, ventas y alertas
            └── <BrowserRouter>      # Enrutamiento SPA
                └── <AppContent />
                    └── <Routes>
                        ├── /login       → Login (público)
                        └── <Route element={<ProtectedRoute><Layout ... /></ProtectedRoute>}>
                            ├── /             → DashboardDemo
                            ├── /ventas       → Ventas (admin, vendedor)
                            ├── /inventario   → PlaceholderPage (admin, almacen)
                            ├── /clientes     → Clientes (admin, vendedor)
                            ├── /alertas      → PlaceholderPage (todos)
                            └── /reportes     → PlaceholderPage (admin)
```

`ProtectedRoute` envuelve el layout completo: sin sesión, cualquier ruta redirige a `/login`. Dentro del layout, cada ruta vuelve a usar `ProtectedRoute` con la lista de roles permitidos. `Layout` actúa como *layout route* y renderiza el contenido mediante `<Outlet />`.

### Dependencias entre componentes

```text
App
├── Login                          # /login (público)
└── ProtectedRoute
    └── Layout
        ├── Sidebar                # menú filtrado por rol
        ├── Navbar
        │   └── AlertBell
        │       └── useAlertas
        └── Outlet
            ├── DashboardDemo
            │   ├── Card, Badge, Button
            │   ├── Table y SearchBar
            │   └── Modal y Toast
            ├── Ventas
            │   ├── POS e historial
            │   └── Modal y Toast
            └── Clientes
                ├── Directorio y formulario admin
                └── Modal y Toast
```

### Flujo de estado

| Estado | Ubicación | Alcance |
| --- | --- | --- |
| Productos, clientes, ventas y alertas | `DatosProvider` | Compartido en memoria |
| Filtro de búsqueda del inventario demo | `DashboardDemo` en `App.jsx` | Local al dashboard |
| Modales POS / producto | `DashboardDemo` en `App.jsx` | Local al dashboard |
| Notificaciones toast | `DashboardDemo` en `App.jsx` | Local al dashboard |
| Formulario de login | `Login` | Local a la vista |
| Alertas | `DatosProvider` mediante `useAlertas` | Compartido durante la sesión |
| Sesión de usuario | `AuthProvider` | Global (contexto + `localStorage`) |
| Sidebar móvil / colapsado | `Layout` | Local al layout |

`DatosProvider` comparte productos, clientes, ventas y alertas durante la sesión. Los cambios son simulados en memoria y no se sincronizan con un servidor.

---

## Rutas de la aplicación

| Ruta | Componente | Roles permitidos | Descripción |
| --- | --- | --- | --- |
| `/login` | `Login` | Público | Acceso de usuario y administrador. |
| `/` | `DashboardDemo` | Todos | Panel principal con KPIs, inventario y modales. |
| `/ventas` | `Ventas` | `admin`, `vendedor` | POS e historial; el vendedor consulta únicamente sus ventas. |
| `/inventario` | `PlaceholderPage` | `admin`, `almacen` | Gestión de inventario y lotes. |
| `/clientes` | `Clientes` | `admin`, `vendedor` | Consulta para ambos roles; CRUD solo para admin. |
| `/alertas` | `PlaceholderPage` | Todos | Centro de alertas de farmacia. |
| `/reportes` | `PlaceholderPage` | `admin` | Reportes y estadísticas. |
| `*` | — | — | Redirige a `/`; si no hay sesión, termina en `/login`. |

La navegación se realiza con `Link` y `NavLink` de React Router. Los enlaces del menú lateral se marcan como activos con la clase `active`. Si un usuario intenta entrar por URL a una ruta sin permiso, `ProtectedRoute` lo redirige al dashboard.

---

## Inicio de sesión y roles

### Flujo de inicio de sesión

1. Sin sesión, cualquier ruta redirige a `/login`.
2. El usuario elige la pestaña **Usuario** o **Administrador**.
3. `Login` valida los campos y llama a `login({ email, password, rol })`.
4. `AuthProvider` busca la cuenta en `src/data/usuarios.js`, comprueba la contraseña y que el rol coincida con la pestaña.
5. Si es correcto, guarda la sesión y redirige al dashboard. Si falla, muestra un mensaje de error.
6. El botón de cerrar sesión de la navbar limpia la sesión y vuelve a `/login`.

### `AuthProvider`

Ubicado en `src/context/AuthProvider.jsx`:

- Inicializa el usuario desde `localStorage.getItem('novasalud_usuario')`.
- Si no hay sesión, deja `usuario` en `null` y la app queda protegida por el login.
- Elimina las claves antiguas `usuario` y `token` para evitar sesiones heredadas.
- Valida las credenciales contra `usuariosDemo` (`src/data/usuarios.js`).
- Comprueba que la cuenta corresponda al tipo de acceso seleccionado.
- Guarda `novasalud_usuario` y un token simulado `novasalud_token`; **nunca guarda la contraseña**.
- Expone `usuario`, `login`, `logout`, `setUsuario` e `isAuthenticated` mediante `AuthContext`.
- `logout()` elimina las claves de sesión y deja `usuario` en `null`.

### `useAuth`

Hook de acceso al contexto. Si se usa fuera del proveedor, devuelve `usuario: null`, `isAuthenticated: false` y funciones seguras para evitar errores.

```jsx
import { useAuth } from './context'

function MiComponente() {
  const { usuario, logout, isAuthenticated } = useAuth()
  return <span>{isAuthenticated ? usuario.nombre : 'Sin sesión'}</span>
}
```

### Roles y visibilidad del menú

| Rol | Etiqueta en interfaz | Módulos visibles en el sidebar |
| --- | --- | --- |
| `admin` | Administrador | Dashboard, Ventas, Inventario, Clientes, Alertas, Reportes |
| `vendedor` | Vendedor (POS) | Dashboard, Ventas, Clientes, Alertas |
| `almacen` | Encargado Almacén | Dashboard, Inventario, Alertas |

> **Nota:** además de ocultar enlaces, las rutas están protegidas con `ProtectedRoute`. Un vendedor que intente abrir `/inventario` o `/reportes` por URL es redirigido al dashboard.

### `ProtectedRoute`

Componente usado para exigir sesión y, opcionalmente, roles específicos.

Props:

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Contenido a renderizar si se autoriza. |
| `roles` | `string[]` | — | Roles permitidos. Si se omite, solo exige sesión. |
| `user` | `object` | — | Usuario explícito; si no, usa `useAuth()`. |
| `redirectTo` | `string` | `'/login'` | Ruta de redirección sin sesión. |
| `fallbackTo` | `string` | `'/'` | Ruta de redirección sin permisos. |

---

## Catálogo de componentes

Todos los componentes viven en `src/components/<Nombre>/` y se importan directamente:

```jsx
import Layout from './components/Layout/Layout'
import Login from './components/Login/Login'
import Navbar from './components/Navbar/Navbar'
import Sidebar from './components/Sidebar/Sidebar'
import AlertBell from './components/AlertBell/AlertBell'
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute'
import Card from './components/Card/Card'
import Modal from './components/Modal/Modal'
import Badge from './components/Badge/Badge'
import Button from './components/Button/Button'
import Table from './components/Table/Table'
import Toast from './components/Toast/Toast'
import SearchBar from './components/SearchBar/SearchBar'
```

### Resumen

| Componente | Archivo | Propósito |
| --- | --- | --- |
| `Layout` | `Layout/Layout.jsx` | Envoltorio general: sidebar, navbar, contenido y footer. |
| `Login` | `Login/Login.jsx` | Acceso de usuario y administrador con sesión simulada. |
| `Navbar` | `Navbar/Navbar.jsx` | Barra superior con buscador, sucursal, alertas y usuario. |
| `Sidebar` | `Sidebar/Sidebar.jsx` | Menú lateral filtrado por rol, colapsable y responsive. |
| `AlertBell` | `AlertBell/AlertBell.jsx` | Campana con contador y dropdown de alertas. |
| `ProtectedRoute` | `ProtectedRoute/ProtectedRoute.jsx` | Guard de rutas por sesión y roles. |
| `Card` | `Card/Card.jsx` | Tarjeta de indicadores/KPI con tendencia. |
| `Modal` | `Modal/Modal.jsx` | Diálogo accesible con cierre por Escape y overlay. |
| `Badge` | `Badge/Badge.jsx` | Insignia de estado, rol o categoría. |
| `Button` | `Button/Button.jsx` | Botón con variantes, tamaños, icono y estado de carga. |
| `Table` | `Table/Table.jsx` | Tabla configurable con estados de carga y vacío. |
| `Toast` | `Toast/Toast.jsx` | Notificación flotante con autocierre. |
| `SearchBar` | `SearchBar/SearchBar.jsx` | Buscador con autofocus y soporte para lector POS. |

### `Login`

Componente de página completa, sin props. Usa `useAuth()` y `useNavigate()`.

- Pestañas **Usuario** (`vendedor`) y **Administrador** (`admin`).
- Valida correo, contraseña y coincidencia con la pestaña.
- Muestra/Ocultar contraseña, estado de carga, error y credenciales demo con autocompletado.
- Si ya existe una sesión, redirige automáticamente a `/`.

### Props principales

#### `Layout`

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `children` | `ReactNode` | Contenido. Si se omite, renderiza `<Outlet />`. |
| `user` | `object` | Usuario para navbar y sidebar. |
| `alertas` | `array` | Alertas para la campana. |
| `onLogout` | `function` | Acción del botón de cerrar sesión. |

#### `Navbar`

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `onToggleSidebar` | `function` | Abre/cierra el sidebar móvil. |
| `user` | `object` | Datos del usuario (`nombre`, `rol`, `sucursal`). |
| `onLogout` | `function` | Acción de cierre de sesión. |
| `alertas` | `array` | Alertas para `AlertBell`. |

#### `Sidebar`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | `false` | Estado del menú móvil. |
| `onClose` | `function` | — | Cierra el menú móvil. |
| `isCollapsed` | `boolean` | `false` | Modo compacto en escritorio. |
| `onToggleCollapse` | `function` | — | Alterna el modo compacto. |
| `userRole` | `string` | `'admin'` | Rol para filtrar el menú. |
| `alertCount` | `number` | `3` | Contador de la insignia de alertas. |

#### `AlertBell`

| Prop | Tipo | Descripción |
| --- | --- | --- |
| `alertas` | `array` | Lista explícita. Si se omite, usa `useAlertas()`. |
| `onAlertClick` | `function` | Callback al seleccionar una alerta. |

#### `Card`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `title` | `string` | — | Título de la tarjeta. |
| `value` | `string \| number` | — | Valor principal. |
| `subtitle` | `string` | — | Texto secundario. |
| `icon` | `string` | `'📈'` | Icono (emoji o texto). |
| `variant` | `string` | `'primary'` | `primary`, `success`, `warning`, `danger`, `info`. |
| `trend` | `object` | — | `{ direction: 'up' \| 'down', text: string }`. |
| `children` | `ReactNode` | — | Contenido adicional. |
| `onClick` | `function` | — | Acción al hacer clic. |

#### `Modal`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `isOpen` | `boolean` | — | Controla la visibilidad. |
| `onClose` | `function` | — | Cierre por botón, overlay o Escape. |
| `title` | `string` | — | Título del diálogo. |
| `icon` | `string` | — | Icono del encabezado. |
| `size` | `string` | `'md'` | `sm`, `md`, `lg`, `xl`. |
| `children` | `ReactNode` | — | Cuerpo del modal. |
| `footer` | `ReactNode` | — | Acciones del pie. |

#### `Badge`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Texto de la insignia. |
| `variant` | `string` | `'neutral'` | `success`, `danger`, `warning`, `primary`, `info`, `neutral`. |
| `size` | `string` | `'md'` | `sm`, `md`, `lg`. |
| `dot` | `boolean` | `false` | Muestra un punto de estado. |
| `icon` | `string` | — | Icono opcional. |

#### `Button`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `children` | `ReactNode` | — | Texto del botón. |
| `type` | `string` | `'button'` | `button`, `submit`, `reset`. |
| `variant` | `string` | `'primary'` | `primary`, `success`, `danger`, `outline`, `ghost`. |
| `size` | `string` | `'md'` | `sm`, `md`, `lg`. |
| `loading` | `boolean` | `false` | Muestra spinner y deshabilita. |
| `disabled` | `boolean` | `false` | Deshabilita el botón. |
| `icon` | `string` | — | Icono antes del texto. |
| `fullWidth` | `boolean` | `false` | Ocupa el 100 % del ancho. |
| `onClick` | `function` | — | Manejador de clic. |

#### `Table`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `columns` | `array` | `[]` | Definición de columnas. |
| `data` | `array` | `[]` | Filas a mostrar. |
| `isLoading` | `boolean` | `false` | Muestra el estado de carga. |
| `emptyMessage` | `string` | `'No se encontraron registros...'` | Mensaje sin datos. |
| `emptyIcon` | `string` | `'📋'` | Icono del estado vacío. |
| `renderFooter` | `function` | — | Renderiza el pie con las filas visibles. |

Cada columna acepta:

```js
{
  header: 'Medicamento', // encabezado
  key: 'nombre',         // propiedad de la fila
  align: 'left',         // left | center | right
  width: 'auto',         // ancho CSS
  render: (value, row, index) => <span>{value}</span> // opcional
}
```

#### `SearchBar`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `value` | `string` | — | Texto controlado. |
| `onChange` | `function` | — | Cambio de texto. |
| `onSearch` | `function` | — | Acción al presionar Enter. |
| `placeholder` | `string` | Texto de búsqueda | Placeholder. |
| `autoFocus` | `boolean` | `true` | Enfoca al montar. |
| `showScannerBadge` | `boolean` | `true` | Muestra la etiqueta “Lector POS”. |

#### `Toast`

| Prop | Tipo | Valor por defecto | Descripción |
| --- | --- | --- | --- |
| `title` | `string` | — | Título de la notificación. |
| `message` | `string` | — | Mensaje descriptivo. |
| `type` | `string` | `'success'` | `success`, `error`, `warning`, `info`. |
| `onClose` | `function` | — | Cierre manual y temporizador. |
| `duration` | `number` | `4000` | Milisegundos antes de autocerrar. |

### Ejemplos de uso

**Botón con icono y variante:**

```jsx
<Button variant="success" icon="🛒" onClick={abrirPOS}>
  Nueva Venta (F2)
</Button>
```

**Tabla configurable:**

```jsx
<Table
  columns={[
    { header: 'Código', key: 'codigo' },
    { header: 'Medicamento', key: 'nombre' },
    { header: 'Stock', key: 'stock', align: 'center' }
  ]}
  data={productos}
  renderFooter={(filas) => <span>Mostrando {filas.length} productos</span>}
/>
```

**Modal controlado:**

```jsx
const [abierto, setAbierto] = useState(false)

<Modal
  isOpen={abierto}
  onClose={() => setAbierto(false)}
  title="Nueva Venta"
  icon="🛒"
  footer={<Button onClick={guardar}>Confirmar</Button>}
>
  <p>Contenido del modal</p>
</Modal>
```

---

## Hooks

### `useAlertas`

Archivo: `src/hooks/useAlertas.js`

Gestiona las alertas compartidas de la sesión cuando se usa dentro de `DatosProvider`, y conserva una lista local compatible si se utiliza fuera del proveedor.

```js
const {
  alertas,        // lista actual
  nuevaAlerta,    // última alerta agregada
  agregarAlerta,  // (alerta) => void
  resolverAlerta, // (id) => void
  setAlertas      // setter de React
} = useAlertas()
```

> Las ventas pueden generar alertas de stock bajo o agotado. El estado no se persiste al recargar la página.

### `useAuth`

Archivo: `src/context/useAuth.js`

```js
const { usuario, login, logout, setUsuario, isAuthenticated } = useAuth()
```

Si se invoca fuera de `AuthProvider`, devuelve `usuario: null`, `isAuthenticated: false` y funciones seguras.

---

## Sistema de diseño

### Paleta y tokens

Definidos en `src/index.css` mediante variables CSS:

| Token | Valor | Uso |
| --- | --- | --- |
| `--primary` | `#0d9488` | Color principal (teal médico). |
| `--primary-hover` | `#0f766e` | Hover del color principal. |
| `--primary-light` | `#f0fdfa` | Fondos suaves. |
| `--primary-border` | `#ccfbf1` | Bordes suaves. |
| `--secondary` | `#0284c7` | Azul complementario. |
| `--accent` | `#6366f1` | Acento índigo. |
| `--success` | `#10b981` | Estados positivos. |
| `--warning` | `#f59e0b` | Advertencias. |
| `--danger` | `#ef4444` | Errores y stock crítico. |
| `--info` | `#3b82f6` | Información. |
| `--bg-main` | `#f8fafc` | Fondo general. |
| `--bg-surface` | `#ffffff` | Superficies y tarjetas. |
| `--bg-muted` | `#f1f5f9` | Fondos atenuados. |
| `--text-main` | `#0f172a` | Texto principal. |
| `--text-muted` | `#64748b` | Texto secundario. |
| `--text-light` | `#94a3b8` | Texto terciario. |
| `--border-color` | `#e2e8f0` | Bordes. |
| `--radius-sm` … `--radius-full` | `8px` … `9999px` | Radios de borde. |
| `--shadow-sm` … `--shadow-lg` | — | Sombras. |

### Tipografía

- Fuente principal: **Plus Jakarta Sans** (Google Fonts), cargada en `index.html` con pesos 300–800.
- Fallback: `system-ui`, `-apple-system`, `Segoe UI`, `Roboto`, etc.

### Estilos

- `src/index.css`: reset, tokens, tipografía base, scrollbar y fondo global.
- `src/App.css`: banner del dashboard, grilla de KPIs y layout de dos columnas.
- `src/components/<Nombre>/<Nombre>.css`: un archivo de estilos por componente, importado desde su `.jsx`. `Login.css` incluye el diseño de pantalla completa y su comportamiento responsive.
- **Bootstrap** se importa globalmente en `main.jsx` como base, pero la interfaz usa principalmente CSS propio con clases `novasalud-*`.

### Responsive

- La grilla principal del dashboard pasa de dos columnas a una en pantallas de hasta **1024 px**.
- El login muestra el panel de marca y el formulario en dos columnas; por debajo de **980 px** oculta el panel decorativo y deja solo el formulario.
- El sidebar se convierte en un panel móvil con fondo oscuro (`sidebar-backdrop`) en pantallas pequeñas.
- El sidebar puede contraerse en escritorio para mostrar solo iconos.
- Navbar, tarjetas y tablas se adaptan con flexbox, grid y scroll horizontal.

### Accesibilidad

- Botones con `aria-label` en acciones icónicas.
- Login con pestañas `role="tab"`, `aria-selected` y etiquetas asociadas a cada campo.
- Modal con `role="dialog"`, `aria-modal`, cierre con Escape y bloqueo del scroll del body.
- Campana de alertas con `aria-expanded` y `aria-label` dinámico.
- Búsqueda con autofocus para facilitar el uso de lectores de código de barras.

---

## Datos simulados

### Producto

Definido en `src/data/productos.js` y compartido mediante `DatosProvider`:

| Campo | Tipo | Ejemplo | Descripción |
| --- | --- | --- | --- |
| `id` | `number` | `1` | Identificador. |
| `codigo` | `string` | `MED-001` | Código interno. |
| `nombre` | `string` | `Paracetamol 500mg Tab x100` | Nombre del medicamento. |
| `stock` | `number` | `3` | Unidades disponibles. |
| `minimo` | `number` | `15` | Stock mínimo requerido. |
| `estado` | `string` | `stock_bajo` | `stock_bajo`, `por_vencer`, `agotado`, `normal`. |
| `estadoLabel` | `string` | `Stock Bajo` | Texto para la insignia. |
| `precio` | `number` | `8.50` | Precio de venta en soles. |
| `fechaVencimiento` | `string` | `2027-06-30` | Fecha de vencimiento del producto. |
| `categoria` | `string` | `Analgésicos` | Categoría del producto. |
| `requiereReceta` | `boolean` | `false` | Exige verificar receta antes del cobro. |

Productos de demostración: Paracetamol, Amoxicilina, Ibuprofeno, Loratadina, Omeprazol y otros.

Los clientes y las ventas de muestra están definidos en `src/data/clientes.js` y `src/data/ventas.js`. El POS rebaja el stock al completar una venta y lo devuelve al anularla; los niveles iguales o inferiores al mínimo generan una alerta compartida.

### Alerta

| Campo | Tipo | Ejemplo |
| --- | --- | --- |
| `id` | `number` | `1` |
| `tipo` | `string` | `stock_bajo`, `por_vencer`, `agotado` |
| `titulo` | `string` | `Stock crítico: Paracetamol 500mg` |
| `descripcion` | `string` | `Quedan 3 unidades (mínimo requerido: 15)` |
| `tiempo` | `string` | `Hace 10 min` |
| `icono` | `string` | `⚠️` |

### Usuario

Las cuentas demo viven en `src/data/usuarios.js`. La sesión persistida excluye la contraseña.

| Campo | Tipo | Ejemplo | Descripción |
| --- | --- | --- | --- |
| `id` | `number` | `1` | Identificador de la cuenta. |
| `nombre` | `string` | `Daniel Mendoza` | Nombre mostrado en la navbar. |
| `email` | `string` | `admin@novasalud.pe` | Correo de acceso. |
| `password` | `string` | `admin123` | Solo existe en el archivo de datos demo. |
| `rol` | `string` | `admin` | `admin`, `vendedor`, `almacen`. |
| `cargo` | `string` | `Administrador` | Etiqueta del cargo. |
| `sucursal` | `string` | `Botica Central` | Sucursal asignada. |

---

## Estado actual y limitaciones

- **Sin backend:** todos los datos son locales y se pierden al recargar (excepto la sesión en `localStorage`).
- **Rutas de módulos:** Inventario, Alertas y Reportes continúan como páginas de marcador de posición.
- **Autenticación simulada:** las cuentas viven en `src/data/usuarios.js`; no hay API, JWT real ni validación en servidor.
- **Credenciales demo visibles:** el login muestra las cuentas de prueba con fines académicos.
- **Sesión local:** el token es simulado y se guarda en `localStorage`; cualquiera con acceso al navegador puede modificarlo.
- **Búsqueda global:** el buscador de la navbar solo registra el término en consola.
- **Estado de negocio:** productos, clientes, ventas y alertas se comparten durante la sesión, pero no se persisten al recargar ni se sincronizan con backend.
- **Favicon:** `index.html` referencia `/vite.svg`, archivo que no existe en `public/` (provoca un 404). Los archivos `favicon.svg` e `icons.svg` no se usan.
- **Recursos sin uso:** `src/assets/hero.png`, `react.svg`, `vite.svg` y `public/icons.svg`.
- **Sin pruebas:** no hay configuración de tests unitarios ni end-to-end.
- **Sin TypeScript:** el código es JavaScript/JSX.
- **Build SPA:** al desplegar con `BrowserRouter` se requiere una regla de fallback hacia `index.html`.

---

## Próximos pasos

1. Implementar las páginas reales de Inventario, Alertas y Reportes.
2. Reemplazar los datos mock y la autenticación simulada por una API/backend con sesiones reales (JWT o cookies).
3. Añadir “Recordarme”, recuperación de contraseña y cierre de sesión por inactividad.
4. Persistir el estado de negocio y conectar el centro de alertas con un backend.
5. Conectar la búsqueda global de la navbar.
6. Añadir pruebas con Vitest y React Testing Library, incluyendo los flujos de login y roles.
7. Corregir el favicon y limpiar los recursos no utilizados.
8. Evaluar migración a TypeScript y división de `App.jsx` en páginas independientes.
9. Configurar despliegue con fallback SPA y variables de entorno.

---

## Solución de problemas

| Problema | Causa probable | Solución |
| --- | --- | --- |
| `Failed to resolve import "react-router-dom"` | Dependencia no instalada. | Ejecuta `npm install`. |
| La página queda en blanco al abrir `index.html` | Se abrió el archivo directamente. | Usa `npm run dev` y abre `http://localhost:5173`. |
| Error de versión de Node | Node anterior a 20.19. | Actualiza Node.js a 22 LTS o superior. |
| El puerto 5173 está ocupado | Otro proceso o instancia de Vite. | Usa `npm run dev -- --port 5174`. |
| Laragon/Apache muestra el código fuente | Apache no compila JSX ni módulos ES. | Usa el servidor de Vite o sirve el contenido de `dist/`. |
| Al recargar una ruta en producción da 404 | Falta fallback SPA en el servidor. | Configura la regla de reescritura hacia `index.html`. |
| No puedo iniciar sesión | Credenciales incorrectas o pestaña equivocada. | Usa las cuentas demo y selecciona **Usuario** o **Administrador** según corresponda. |
| La app siempre me devuelve a `/login` | No hay sesión guardada o se limpió `localStorage`. | Inicia sesión nuevamente. |
| La sesión no cambia | Datos persistidos en `localStorage`. | Limpia `novasalud_usuario` y `novasalud_token`, y recarga. |

Comandos útiles:

```powershell
# Limpiar instalación y reinstalar
Remove-Item -Recurse -Force node_modules
npm install

# Verificar dependencias declaradas
npm ls --depth=0

# Revisar errores de lint
npm run lint
```

---

## Despliegue en producción

1. Genera el build:

   ```powershell
   npm run build
   ```

   El resultado se crea en `dist/`.

2. Verifica el build localmente:

   ```powershell
   npm run preview
   ```

3. Copia el contenido de `dist/` al servidor web.

### Fallback para SPA con Apache/Laragon

Como se usa `BrowserRouter`, las rutas deben reescribirse a `index.html`. Ejemplo de `.htaccess` en la raíz del sitio:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

Si la aplicación se publica en un subdirectorio (por ejemplo `http://localhost/app-novasalud/`), configura la base en `vite.config.js`:

```js
export default defineConfig({
  plugins: [react()],
  base: '/app-novasalud/'
})
```

Y ajusta el `RewriteBase` del `.htaccess` al mismo subdirectorio.

> Para desarrollo no necesitas Apache ni Laragon: Vite es suficiente.

---

## Convenciones de desarrollo

- **Componentes:** PascalCase y una carpeta por componente: `src/components/MiComponente/MiComponente.jsx` + `MiComponente.css`.
- **Estilos:** el CSS vive en la misma carpeta del componente y se importa desde su `.jsx`.
- **Importaciones:** usa rutas directas (`./components/Navbar/Navbar`); no hay barrels de componentes ni rutas duplicadas.
- **Clases CSS:** prefijo `novasalud-` para componentes globales y nombres descriptivos para el layout y el login.
- **Tokens:** usa las variables de `src/index.css` en lugar de valores de color duplicados.
- **Idioma:** textos de interfaz y comentarios en español.
- **Calidad:** ejecuta `npm run lint` antes de confirmar cambios.
- **Datos mock:** mantén los datos de demostración en `src/data` y sepáralos de la futura capa de servicios/API.

Flujo recomendado:

```powershell
npm run lint
npm run build
npm run preview
```

---

## Licencia

Este repositorio no incluye una licencia explícita. Se trata de un proyecto académico/educativo; consulta con los responsables del proyecto antes de redistribuirlo o usarlo comercialmente.

---

**Nova Salud** — Sistema Integral de Gestión Farmacéutica y Punto de Venta.
