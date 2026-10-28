export const ventasMock = [
  { id: 142, serie_numero: 'B001-0142', fecha: '2026-10-28T10:42:00-05:00', metodo_pago: 'efectivo', total: 13.80, estado: 'pagada', usuario_nombre: 'Lucía Torres' },
  { id: 141, serie_numero: 'B001-0141', fecha: '2026-10-28T09:10:00-05:00', metodo_pago: 'yape', total: 24.50, estado: 'espera', usuario_nombre: 'Lucía Torres' }
]

export const ventasDetalleMock = {
  142: {
    id: 142,
    serie_numero: 'B001-0142',
    fecha: '2026-10-28T10:42:00-05:00',
    comprobante: 'boleta',
    estado: 'pagada',
    items: [{ producto_id: 1, nombre: 'Paracetamol 500mg', cantidad: 10, precio_unitario: 0.40, subtotal: 4.00 }],
    subtotal: 11.69,
    igv: 2.11,
    total: 13.80,
    pagos: [{ metodo: 'efectivo', monto: 20.00 }],
    vuelto: 6.20
  },
  141: {
    id: 141,
    serie_numero: 'B001-0141',
    fecha: '2026-10-28T09:10:00-05:00',
    comprobante: 'boleta',
    estado: 'espera',
    items: [{ producto_id: 4, nombre: 'Loratadina 10mg', cantidad: 1, precio_unitario: 24.50, subtotal: 24.50 }],
    subtotal: 20.76,
    igv: 3.74,
    total: 24.50,
    pagos: [],
    vuelto: 0
  }
}
