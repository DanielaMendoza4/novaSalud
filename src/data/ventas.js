export const ventasIniciales = [
  {
    id: 'V-2026-001',
    fecha: '2026-10-27T09:15:00',
    clienteId: 2,
    clienteNombre: 'María Fernanda Rojas',
    clienteDocumento: '45678912',
    trabajadorId: 2,
    trabajador: 'Lucía Torres',
    metodoPago: 'yape',
    tipoComprobante: 'boleta',
    estado: 'completada',
    subtotal: 18,
    igv: 3.24,
    total: 21.24,
    recibido: 21.24,
    vuelto: 0,
    items: [{ productoId: 2, codigo: 'MED-002', nombre: 'Amoxicilina 500mg Cap x20', cantidad: 1, precio: 18 }]
  },
  {
    id: 'V-2026-002',
    fecha: '2026-10-27T10:42:00',
    clienteId: 1,
    clienteNombre: 'Cliente general',
    clienteDocumento: '00000000',
    trabajadorId: 1,
    trabajador: 'Daniel Mendoza',
    metodoPago: 'efectivo',
    tipoComprobante: 'boleta',
    estado: 'completada',
    subtotal: 31,
    igv: 5.58,
    total: 36.58,
    recibido: 40,
    vuelto: 3.42,
    items: [
      { productoId: 4, codigo: 'MED-004', nombre: 'Loratadina 10mg Tab x30', cantidad: 1, precio: 15.5 },
      { productoId: 7, codigo: 'MED-007', nombre: 'Vitamina C 1g Efervescente x10', cantidad: 1, precio: 13.9 }
    ]
  }
]
