# Arquitectura del proyecto — Pronto Connect

Este documento explica cómo está armado el proyecto para que cualquiera (vos, otro dev, o yo en una sesión futura) pueda entenderlo rápido y seguir el mismo patrón al tocar código.

## 1. Stack tecnológico

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4** para estilos (clases utilitarias, sin CSS-in-JS)
- **React Router v7** — se importa de `"react-router"`, **no** de `"react-router-dom"`
- **Zustand** — estado global liviano (hoy solo se usa para la sesión: `src/store/authStore.ts`)
- **Axios** — cliente HTTP único (`src/lib/apiClient.ts`)
- **Socket.IO client** — llamadas en vivo (integración GoToConnect)
- **DOMPurify** — sanitizar HTML que llega del backend antes de renderizarlo
- Base: plantilla **TailAdmin Pro** (trae muchísimas páginas demo que no son parte del negocio real — ver sección 7)

## 2. Estructura de carpetas (`src/`)

```
src/
├── App.tsx                    # Todas las rutas de la app
├── main.tsx                   # Bootstrap: StrictMode, ThemeProvider, AppWrapper
│
├── lib/                        # Capa de datos — una carpeta por módulo de negocio
│   ├── apiClient.ts             # Instancia de axios compartida (baseURL + interceptors)
│   ├── auth/
│   ├── orders/
│   ├── customers/
│   ├── sms-logs/
│   ├── sms-templates/
│   ├── email-templates/
│   ├── tickets/
│   ├── cancellations/
│   ├── closure-methods/
│   ├── contact-reasons/
│   ├── permissions/
│   ├── roles/
│   ├── users/
│   ├── answered-calls/
│   ├── goToConnect/             # Tipos + helpers del evento "llamada contestada"
│   └── globalSearch/
│
├── components/                  # UI, organizada por módulo (mismo nombre que en lib/)
│   ├── ui/                       # Piezas base de la plantilla: Modal, Table, Button, Dropdown...
│   ├── common/                    # PageMeta, PageBreadcrumb, ComponentCard, ConfirmModal...
│   ├── form/                       # Input, TextArea, Select, Switch, Radio, Label...
│   ├── header/                      # Widgets del header (LatestCallStatus, QualifyCallModal, UserDropdown)
│   └── {modulo}/                     # XTable.tsx, XDetailView.tsx, XFormModal.tsx
│
├── pages/{Modulo}/                    # XList.tsx, XDetail.tsx — arman layout + wiring de datos
│
├── context/                            # Estado global vía React Context
│   ├── SidebarContext.tsx
│   ├── GlobalSearchContext.tsx
│   ├── GoToConnectContext.tsx
│   ├── ThemeContext.tsx
│   └── AuthContext.tsx                  # ⚠️ Remanente de la plantilla — NO se usa (ver sección 5)
│
├── store/
│   └── authStore.ts                      # Zustand: token, user, isAuthenticated (persistido en localStorage)
│
├── hooks/
│   ├── useModal.ts                        # { isOpen, openModal, closeModal, toggleModal }
│   ├── useClickOutside.ts
│   └── useGoBack.ts
│
├── layout/
│   ├── AppLayout.tsx                       # Layout autenticado: Sidebar + Header + <Outlet/>
│   ├── AppHeader.tsx
│   ├── AppSidebar.tsx                        # navItems[] — acá se agrega el ítem de cada módulo nuevo
│   └── AlternativeLayout.tsx                  # Layout usado solo por las páginas de "Ai Generator"
│
├── utils/
│   ├── index.ts                                # cn() — merge de clases Tailwind
│   └── date.ts                                  # formatDate()/formatDateTime() — formato MM/DD/YYYY forzado
│
└── icons/index.ts                                # Barrel de todos los SVG de la plantilla
```

## 3. El patrón de un módulo ATC

Prácticamente todo módulo de negocio (Orders, Customers, Tickets, Cancellations, SMS/Email Templates, Closure Methods, Contact Reasons, Permissions, Roles, Users...) sigue **la misma receta**. Antes de escribir un módulo nuevo, conviene mirar uno ya existente parecido (`contact-reasons` es el más simple; `roles` muestra además cómo manejar una relación con otra entidad).

### 3.1 Capa de datos — `src/lib/{modulo}/`

- **`types.ts`**: interfaces que reflejan **1 a 1** la forma real de la respuesta de la API (nunca se inventan campos "porque tendría sentido que estén").
  - `{X}Item` — forma de un registro en el listado.
  - `{X}sResponse` — normalmente `{ currentPage, totalPages, totalItems, items: {X}Item[] }`. **Ojo:** algunos endpoints "paginados" en realidad devuelven un array plano sin envelope — siempre hay que confirmar con la respuesta real antes de tipar (nos pasó con `sms-templates`).
  - `Create{X}Payload` / `Update{X}Payload` — a veces difieren de `{X}Item` (ej. el nombre interno puede autogenerarse en el servidor y no pedirse en el create).
- **`{modulo}Service.ts`**: objeto plano con un método por endpoint, siempre usando `apiClient` (nunca `axios` directo ni `fetch`). Métodos típicos: `getAll`, `getPaginated`, `getById`, `getByInternalName`/`getByEmail`, `create`, `update`, `remove`.

### 3.2 UI — `src/components/{modulo}/`

- **`{X}Table.tsx`**: filtros + `Table`/`TableBody`/`TableCell` (de `components/ui/table`) + `PaginationWithIcon` + botón(es) de acción por fila (ícono de ojo/lápiz/basura, siempre SVG inline, nunca de librería externa de íconos).
- **`{X}FormModal.tsx`** (si el módulo tiene create/edit): usa `Modal` + `useModal()`, mismo layout de header + campos + footer con botones Cancel/Save.
- **`{X}DetailView.tsx`** (si el módulo tiene vista de detalle, ej. Orders/Customers/Tickets/Cancellations): es un componente **puramente presentacional** (recibe el objeto ya cargado por props) para poder reusarse tanto en la página de detalle completa como en previews (ej. el buscador global).
- **Borrado**: se reusa `src/components/common/ConfirmModal.tsx` (modal de confirmación genérico) — nunca se borra sin confirmar.

### 3.3 Páginas — `src/pages/{Modulo}/`

- **`{X}List.tsx`**: `PageMeta` + `PageBreadcrumb` + `ComponentCard` envolviendo la `{X}Table`.
- **`{X}Detail.tsx`** (si aplica): hace el fetch por `useParams`/`useSearchParams`, maneja loading/error, y renderiza `{X}DetailView`. El botón "Back" respeta `location.state.from` (para volver a donde el usuario vino, ej. desde el detalle de un cliente) con fallback a la lista del propio módulo.

### 3.4 Wiring final

1. Ruta en `src/App.tsx` (dentro del grupo `<Route element={<ProtectedRoute/>}><Route element={<AppLayout/>}>`).
2. Ítem en `navItems` de `src/layout/AppSidebar.tsx` (elegir un ícono ya existente en `src/icons/index.ts` y descomentar su import).

## 4. Convenciones que costó aprender (para no repetir errores)

- **Nunca asumir la forma de una respuesta.** Varias veces la documentación mostraba un array plano pero el endpoint real devolvía `{currentPage,...,items}` (o al revés). Siempre pedir/confirmar un JSON real de respuesta antes de tipar, y validar con `Array.isArray()` u otros chequeos defensivos cuando hay dudas.
- **Los nombres de campos NO son consistentes entre módulos.** Ejemplos reales que ya nos pasaron:
  - `closure-methods` / `contact-reasons`: el `internalName` se autogenera en el servidor (no se manda en el create).
  - `permissions`: el create pide `internal_name` en **snake_case**.
  - `roles`: el create pide `internalName` en **camelCase**.
  - Un mismo concepto de "activo" puede ser `"yes"/"no"` (sms-templates) o `"Y"/"N"` (email-templates).
  - Para selects que dependen de otro módulo, a veces hay que mandar el **nombre visible** (`reasonName`/`methodName`) y no el `id` ni el `internalName` (caso `answered-calls`).
  - **Conclusión:** nunca copiar el payload de un módulo a otro sin confirmar contra la doc/JSON real de ESE endpoint puntual.
- **Fechas:** todo el proyecto muestra fechas en formato `MM/DD/YYYY` (decisión explícita, sin depender del locale del navegador). Usar siempre `formatDate`/`formatDateTime` de `src/utils/date.ts`, nunca `toLocaleDateString()` a mano.
- **HTML que viene del backend** (descripciones de tickets, mensajes de estado de orden) puede traer HTML crudo, a veces con texto de cliente interpolado sin escapar. Sanitizar **siempre** con `DOMPurify.sanitize()` antes de usar `dangerouslySetInnerHTML` — nunca renderizar como texto plano (se ven los tags crudos) ni sin sanitizar (riesgo de XSS almacenado).
- **Flujo "volver" (`Back`)**: cuando una página de detalle puede abrirse desde varios lugares (ej. detalle de una orden desde el detalle de un cliente), el origen se pasa vía `navigate(path, { state: { from: \`${location.pathname}${location.search}\` } })`, y la página destino lee `location.state?.from` con un fallback a su ruta "natural" (ej. `/orders`).
- **`store_url: "ideal"` no es una URL real** — si se manda a los endpoints de `customers`, el backend devuelve 404. Se omite del query siempre que valga `"ideal"` o esté vacío.

## 5. Autenticación

- El login real vive en `src/store/authStore.ts` (Zustand + `persist` en localStorage, key `atc-auth`).
- El JWT se decodifica con `jwt-decode`; los campos usados hoy son `name`, `email`, `role_id`, `extension_number`.
- `src/lib/apiClient.ts` agrega el header `Authorization: Bearer {token}` a cada request vía interceptor, y desloguea automáticamente ante un `401`.
- `ProtectedRoute.tsx` redirige a `/atc-signin` si `isAuthenticated` es falso.
- `src/context/AuthContext.tsx` **no se usa** en el flujo real — es un remanente de la plantilla TailAdmin, solo referenciado por un componente demo (`CustomerLoginForm.tsx`) que no forma parte del login real (`AtcLoginForm.tsx` + `authStore`).

## 6. Funcionalidades transversales

Cosas que no son "un módulo" en sí, sino que viven repartidas en varios lugares:

- **Buscador global** (`GlobalSearchContext` + `GlobalSearch` en el sidebar + `GlobalSearchResult` en el área principal): busca por email/teléfono/orden vía `/atc-search/v0/global-search`, y renderiza el resultado reusando `OrderDetailView`/`CustomerDetailView` según el `result_type` que devuelva la API.
- **Llamadas en vivo (GoToConnect)**: `GoToConnectContext` mantiene la conexión Socket.IO (autenticada con el mismo JWT de sesión) y el historial de llamadas contestadas. `LatestCallStatus` (header) muestra solo la última llamada, con el ícono de teléfono "pulsando" mientras el socket está conectado. Al hacer click en esa tarjeta se busca al cliente por teléfono (`customersService.search`) y se navega a su ficha real (`/customers/detail`). El botón "Qualify" abre `QualifyCallModal`, que registra la calificación de la llamada (`POST /answered-calls/atc/v0`) usando los selects de Contact Reasons/Closure Methods y los datos del agente tomados del JWT.

## 7. Páginas heredadas de la plantilla (no tocar salvo que se pida explícitamente)

El repo nació de la plantilla TailAdmin Pro y todavía incluye decenas de páginas demo (Dashboards, Ecommerce, Ui Elements, Charts, Ai Generator, Task, Chat, etc.) que **no son parte del negocio real**. `AppSidebar.tsx` mantiene la mayoría de esos ítems comentados (`_disabledNavItems`) para no perder el código de referencia. Al armar un módulo nuevo es común copiar un patrón visual de estas páginas demo (`Select`, `Switch`, `Modal`, etc.), pero el módulo en sí siempre va en `pages/{Modulo}/`, no ahí.

## 8. Inventario de módulos de negocio ya construidos

| Endpoint base | `lib/` | `pages/` | Notas |
|---|---|---|---|
| `/customer-orders/atc/v0` | `orders` | `Orders` | Incluye cancelación de orden (`CancelOrderModal`) |
| `/customers/atc/v0` | `customers` | `Customers` | El detalle agrega Store Orders + SMS Logs + Tickets + Cancellations del cliente |
| `/sms-logs/atc/v0` | `sms-logs` | `SmsLogs` | Solo lectura |
| `/sms-templates/atc/v0` | `sms-templates` | `SmsTemplates` | CRUD + activar/desactivar (`"yes"/"no"`) |
| `/email-templates/atc/v0` | `email-templates` | `EmailTemplates` | CRUD + activar/desactivar (`"Y"/"N"`), preview de HTML sanitizado |
| `/tickets/atc/v0` | `tickets` | `Tickets` | Solo lectura (Zoho Desk) |
| `/cancellations/atc/v0` | `cancellations` | `Cancellations` | Listado + detalle; la creación se dispara desde Orders |
| `/closure-methods/atc/v0` | `closure-methods` | `ClosureMethods` | CRUD, sin delete documentado |
| `/contact-reasons/atc/v0` | `contact-reasons` | `ContactReasons` | CRUD + delete |
| `/permissions/atc/v0` | `permissions` | `Permissions` | CRUD + delete, `internal_name` en snake_case |
| `/roles/atc/v0` | `roles` | `Roles` | CRUD + asignar permisos (`PUT /{id}/permissions`) |
| `/users/atc/v0` | `users` | `Users` | CRUD + delete, con select de rol |
| `/answered-calls/atc/v0` | `answered-calls` | *(sin página propia)* | Solo POST, se usa desde `QualifyCallModal` |
| Socket.IO (`VITE_SOCKET_URL`) | `goToConnect` | — | Llamadas en vivo |

## 9. Variables de entorno (`.env`)

- `VITE_API_URL` — base de la API REST (ej. `https://.../api`)
- `VITE_SOCKET_URL` — base del servidor Socket.IO de GoToConnect
