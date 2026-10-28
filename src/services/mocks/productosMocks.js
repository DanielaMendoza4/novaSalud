export const productosMock = [
  { id: 1, codigo: 'MED-001', nombre: 'Paracetamol 500mg', presentacion: 'Tab x100', precio: 0.40, stock_total: 3, stock_minimo: 15, requiere_receta: false, proximo_vencimiento: '2027-03-31', estado: 'stock_bajo' },
  { id: 2, codigo: 'MED-002', nombre: 'Amoxicilina 500mg', presentacion: 'Caps x20', precio: 1.25, stock_total: 24, stock_minimo: 10, requiere_receta: true, proximo_vencimiento: '2026-11-15', estado: 'por_vencer' },
  { id: 3, codigo: 'MED-003', nombre: 'Ibuprofeno 400mg', presentacion: 'Tab x50', precio: 0.80, stock_total: 0, stock_minimo: 12, requiere_receta: false, proximo_vencimiento: '2027-04-20', estado: 'agotado' },
  { id: 4, codigo: 'MED-004', nombre: 'Loratadina 10mg', presentacion: 'Tab x30', precio: 0.65, stock_total: 40, stock_minimo: 10, requiere_receta: false, proximo_vencimiento: '2027-08-10', estado: 'normal' },
  { id: 5, codigo: 'MED-005', nombre: 'Producto vencido demo', presentacion: 'Unidad', precio: 2.10, stock_total: 4, stock_minimo: 5, requiere_receta: false, proximo_vencimiento: '2025-01-01', estado: 'vencido' }
]
