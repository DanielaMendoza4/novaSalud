export const resumenMock = {
  trabajador: {
    rol: 'trabajador',
    turno: { id: 7, apertura: '2026-10-28T08:00:00-05:00' },
    ventas_hoy: { monto: 480.50, tickets: 18 },
    efectivo_en_caja: 620.00,
    pagos_digitales: 310.50,
    ventas_en_espera: 2
  },
  admin: {
    rol: 'admin',
    ventas_hoy: { monto: 2480.50, transacciones: 42, variacion_vs_ayer: 14.2 },
    stock_bajo: { cantidad: 8, criticos: 3 },
    por_vencer: { cantidad: 5, dias: 30 },
    inventario: { items: 1240 }
  }
}
