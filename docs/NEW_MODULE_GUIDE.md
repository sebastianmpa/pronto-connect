# Cómo pedir la integración de un módulo nuevo

Esta guía es para vos (o cualquiera) al pedirme que integre un módulo nuevo en este proyecto. Cuanto más completa la info que me des de entrada, menos vueltas necesitamos.

> Para entender cómo queda armado un módulo una vez integrado (carpetas, patrón de código, convenciones), ver [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Lo mínimo indispensable

1. **La URL base del módulo**, ej: `{{pronto_customer_service_api_layer_url}}/api/mi-modulo/atc/v0`
2. **Un JSON real de respuesta de cada endpoint que exista** — no una descripción de "más o menos así va a ser". En concreto:
   - Listado simple, sin paginar (si existe)
   - Listado paginado (`?page=1&limit=10`) — el JSON **completo**, tal cual lo devuelve (a veces es `{currentPage, totalPages, totalItems, items:[...]}`, a veces un array plano — nunca lo asumo, siempre lo confirmo con la respuesta real)
   - Obtener por id
   - Obtener por algún campo alternativo si existe (ej. `internal-name`, `email`)
   - Body **y** respuesta de **crear**
   - Body de **actualizar** (aunque sea "es igual al de crear")
   - Si hay **eliminar**, decímelo explícitamente aunque sea "igual que actualizar pero con DELETE"
3. Si el módulo se relaciona con otro ya existente (ej. Roles↔Permissions, Users→Roles), avisame para armar el select/picker correspondiente en el formulario.

## Preguntas puntuales que conviene responder de una (nos ahorran una vuelta)

- ¿El campo "activo"/"estado" es `"yes"/"no"`, `"Y"/"N"`, boolean, u otra cosa?
- ¿El identificador interno (`internalName` / `internal_name`) lo genera el servidor solo, o hay que mandarlo yo al crear? ¿En qué casing viene (`camelCase` vs `snake_case`)?
- ¿Hay que poder borrar? ¿Con confirmación (por defecto sí, siempre pido confirmación antes de borrar)?
- Si hay un select que depende de otro módulo, ¿qué valor hay que mandar realmente: el `id`, el `internalName`, o el nombre visible? (Ya nos pasó mandar el id cuando en realidad había que mandar el nombre — ver `ARCHITECTURE.md` § 4).
- Si el módulo nuevo también debería aparecer dentro de una pantalla ya existente (ej. "esto también va en el detalle de cliente"), decímelo — lo agrego en la misma tanda en vez de en un pedido aparte.
- ¿Necesita un ícono o nombre puntual en el sidebar? Si no aclarás nada, elijo algo razonable del set ya disponible en `src/icons/index.ts`.

## Plantilla de mensaje (copiar y completar)

```
Vamos con el módulo de <NOMBRE>.

Base: {{pronto_customer_service_api_layer_url}}/api/<ruta>/atc/v0

Listar (sin paginar), si existe:
GET .../atc/v0
<pegar JSON de respuesta real>

Listar paginado:
GET .../atc/v0/paginated?page=1&limit=10
<pegar JSON de respuesta real>

Obtener por id:
GET .../atc/v0/{id}
<pegar JSON>

Crear:
POST .../atc/v0
Body: <pegar JSON>
Respuesta: <pegar JSON>

Actualizar:
PUT .../atc/v0/{id}
Body: <pegar JSON, o "igual que crear">

Eliminar (si aplica):
DELETE .../atc/v0/{id}

Notas:
- Campo activo/estado: ...
- internalName (¿lo genera el server o lo mando yo? ¿casing?): ...
- Se relaciona con: ...
- También debe aparecer en: ...
```

## Qué voy a hacer con esa info

1. `src/lib/<modulo>/types.ts` + `<modulo>Service.ts` — tipado 1:1 con lo que me pasaste, siguiendo el patrón de `ARCHITECTURE.md` § 3.1.
2. Tabla de listado (`<Modulo>Table.tsx`) con filtros, paginación y acciones (ver/editar/borrar según aplique).
3. Modal de crear/editar si el módulo lo requiere (`<Modulo>FormModal.tsx`).
4. Página(s) en `pages/<Modulo>/`, ruta en `App.tsx` e ítem en el sidebar.
5. Typecheck (`tsc -b`) y lint antes de darlo por terminado.

## Qué NO voy a inventar

- No voy a adivinar la forma de una respuesta que no me pasaste — si falta un endpoint, te pregunto en vez de asumir.
- No voy a agregar un botón de "eliminar" si no me confirmaste que existe el endpoint DELETE.
- No voy a mezclar convenciones de otro módulo (ej. copiar el `"activo": "yes"/"no"` de SMS Templates a un módulo nuevo) sin que el JSON real de ESE módulo lo confirme.
