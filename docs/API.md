# Contrato de API - NovaSalud

Acuerdo entre el frontend (Juan) y el backend (compañero). Versión 1. Si algo cambia, se actualiza este documento antes de tocar el código.

## 1. Convenciones

- URL base: `/api` (en desarrollo: `http://localhost:3000/api`).
- Formato: JSON en UTF-8. Fechas en ISO 8601 (`2026-10-28T10:42:00-05:00`). Vencimientos solo fecha (`2027-03-31`).
- Autenticación: header `Authorization: Bearer <token>` en todo, menos el login.
- Roles: `admin` y `trabajador`. El usuario y su rol salen del token, nunca del body.
- Montos: número con 2 decimales (`13.80`). Los precios ya incluyen IGV 18%.
- Listados paginados: `?page=1&limit=20` y respuesta `{ "data": [...], "page": 1, "limit": 20, "total": 120 }`.
- CORS: permitir el origen del frontend (Vite: `http://localhost:5173`).
- Errores: siempre con este formato:

```json
{ "error": { "codigo": "STOCK_INSUFICIENTE", "mensaje": "No hay stock suficiente de Paracetamol 500 mg" } }
```

## 2. Permisos por rol

| Acción | Admin | Trabajador |
| --- | --- | --- |
| Login y ver su perfil | Sí | Sí |
| Resumen del dashboard | Global | Solo lo suyo |
| Ver productos y avisos de stock | Sí | Sí (solo lectura) |
| Crear, editar, eliminar productos y reponer lotes | Sí | No |
| Crear y cobrar ventas | Sí | Sí |
| Listar ventas | Todas | Solo las suyas |
| Anular ventas | Sí | No |
| Abrir y cerrar su propia caja | Sí | Sí |
| Buscar y crear clientes | Sí | Sí |

## 3. Endpoints

### Auth

`POST /api/auth/login`

```json
{ "email": "ana@novasalud.pe", "password": "******" }
```

Respuesta 200:

```json
{ "token": "eyJ...", "usuario": { "id": 2, "nombre": "Ana Torres", "email": "ana@novasalud.pe", "rol": "trabajador" } }
```

Error 401: `CREDENCIALES_INVALIDAS`.

`GET /api/auth/me` devuelve `{ "usuario": { ... } }` con el token actual.

### Resumen del dashboard

`GET /api/resumen` devuelve una forma distinta según el rol del token.

Trabajador:

```json
{
  "rol": "trabajador",
  "turno": { "id": 7, "apertura": "2026-10-28T08:00:00-05:00" },
  "ventas_hoy": { "monto": 480.50, "tickets": 18 },
  "efectivo_en_caja": 620.00,
  "pagos_digitales": 310.50,
  "ventas_en_espera": 2
}
```

`turno` es `null` si no tiene caja abierta.

Admin:

```json
{
  "rol": "admin",
  "ventas_hoy": { "monto": 2480.50, "transacciones": 42, "variacion_vs_ayer": 14.2 },
  "stock_bajo": { "cantidad": 8, "criticos": 3 },
  "por_vencer": { "cantidad": 5, "dias": 30 },
  "inventario": { "items": 1240 }
}
```

### Productos

`GET /api/productos?q=para&page=1` (admin y trabajador). Busca por nombre o código. Cada ítem:

```json
{
  "id": 1, "codigo": "MED-001", "nombre": "Paracetamol 500mg", "presentacion": "Tab x100",
  "precio": 0.40, "stock_total": 3, "stock_minimo": 15, "requiere_receta": false,
  "proximo_vencimiento": "2027-03-31", "estado": "stock_bajo"
}
```

`estado` puede ser: `normal`, `stock_bajo`, `agotado`, `por_vencer`, `vencido`.

Solo admin:

- `POST /api/productos` con `codigo, nombre, presentacion, precio, stock_minimo, requiere_receta`.
- `PUT /api/productos/:id` con los mismos campos.
- `DELETE /api/productos/:id`.
- `POST /api/productos/:id/lotes` con `{ "numero_lote": "L2405", "vencimiento": "2027-03-31", "cantidad": 100 }` (reponer).

### Clientes

- `GET /api/clientes?q=` busca por nombre o documento.
- `POST /api/clientes` con `{ "tipo_doc": "DNI", "numero_doc": "12345678", "nombre": "..." }`.

Validación: DNI de 8 dígitos, RUC de 11.

### Ventas

`POST /api/ventas` (admin y trabajador). El frontend NO envía precios: el backend los toma de la base de datos.

```json
{
  "cliente_id": null,
  "comprobante": "boleta",
  "estado": "pagada",
  "items": [ { "producto_id": 1, "cantidad": 10 }, { "producto_id": 4, "cantidad": 2 } ],
  "pagos": [ { "metodo": "efectivo", "monto": 20.00 } ]
}
```

- `comprobante`: `boleta` o `factura`. `estado`: `pagada` o `espera`.
- Si `estado` es `espera`, `pagos` se omite y no se descuenta stock.
- `metodo`: `efectivo`, `yape`, `plin` o `tarjeta`. Se permite pago mixto (varios pagos).

Respuesta 201:

```json
{
  "id": 142, "serie_numero": "B001-0142", "fecha": "2026-10-28T10:42:00-05:00",
  "comprobante": "boleta", "estado": "pagada",
  "items": [ { "producto_id": 1, "nombre": "Paracetamol 500mg", "cantidad": 10, "precio_unitario": 0.40, "subtotal": 4.00 } ],
  "subtotal": 11.69, "igv": 2.11, "total": 13.80,
  "pagos": [ { "metodo": "efectivo", "monto": 20.00 } ],
  "vuelto": 6.20
}
```

Otros endpoints:

- `GET /api/ventas?estado=&desde=&hasta=&page=` lista `{ id, serie_numero, fecha, metodo_pago, total, estado }`. El trabajador recibe solo las suyas; el admin recibe todas y además `usuario_nombre`.
- `GET /api/ventas/:id` devuelve el detalle. Un trabajador solo puede ver las suyas.
- `PUT /api/ventas/:id/cobrar` pasa una venta en espera a pagada, con `{ "pagos": [ ... ] }`.
- `DELETE /api/ventas/:id` descarta una venta en espera (solo si es del propio usuario).
- `PUT /api/ventas/:id/anular` solo admin; devuelve el stock a sus lotes.

### Turnos (caja)

- `GET /api/turnos/actual` devuelve `{ "id": 7, "apertura": "...", "fondo_inicial": 100.00, "estado": "abierta" }` o `null`.
- `POST /api/turnos/abrir` con `{ "fondo_inicial": 100.00 }`.
- `POST /api/turnos/cerrar` con `{ "efectivo_contado": 620.00 }` y responde `{ "efectivo_esperado": 620.00, "efectivo_contado": 620.00, "diferencia": 0.00 }`.

No se puede vender sin un turno abierto (409 `TURNO_CERRADO`).

### Avisos de stock

`GET /api/avisos-stock` (admin y trabajador, solo lectura):

```json
[
  { "producto_id": 1, "nombre": "Paracetamol 500mg", "tipo": "stock_bajo", "detalle": "3 unidades, mínimo 15" },
  { "producto_id": 3, "nombre": "Ibuprofeno 400mg", "tipo": "agotado", "detalle": "Sin stock" },
  { "producto_id": 2, "nombre": "Amoxicilina 500mg", "tipo": "por_vencer", "detalle": "Vence en 18 días" }
]
```

## 4. Reglas de negocio (las valida el backend)

1. IGV incluido en el precio: `subtotal = total / 1.18` e `igv = total - subtotal`, ambos con 2 decimales.
2. FEFO: el stock se descuenta primero del lote que vence antes.
3. No se pueden vender productos vencidos ni agotados.
4. Registrar una venta es una transacción: venta, detalle, descuento de stock y pagos. Si algo falla, no se guarda nada.
5. Vuelto = suma de pagos en efectivo - total, nunca negativo. Solo aplica si hay pago en efectivo.
6. Factura exige un cliente con RUC. Boleta permite DNI opcional.
7. El número de comprobante es correlativo por serie (`B001`, `F001`) y lo genera el backend.
8. El trabajador solo ve y toca lo suyo: se filtra por el `usuario_id` del token, nunca por un dato que mande el frontend.

## 5. Códigos de error

| Código | HTTP | Cuándo |
| --- | --- | --- |
| `VALIDACION` | 400 | Datos faltantes o inválidos |
| `CREDENCIALES_INVALIDAS` | 401 | Email o contraseña incorrectos |
| `TOKEN_INVALIDO` | 401 | Token ausente, inválido o vencido |
| `SIN_PERMISO` | 403 | El rol no puede hacer esta acción |
| `NO_ENCONTRADO` | 404 | El recurso no existe o no es del usuario |
| `PRODUCTO_NO_DISPONIBLE` | 409 | Producto vencido o agotado |
| `STOCK_INSUFICIENTE` | 409 | Cantidad mayor al stock |
| `TURNO_CERRADO` | 409 | Venta sin caja abierta |

## 6. Pendientes por acordar

- Categorías de producto: el dashboard del admin las muestra, pero el esquema actual no las tiene.
- Duración del token y si habrá refresco.
- Reportes del admin (se definen después).
- Cómo se cargan los datos iniciales (usuarios y productos).
