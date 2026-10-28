// Cuentas simuladas para el acceso de demostración de Nova Salud.
// En producción estas credenciales deben validarse contra un backend real.
export const usuariosDemo = [
  {
    id: 1,
    nombre: 'Daniel Mendoza',
    email: 'admin@novasalud.pe',
    password: 'admin123',
    rol: 'admin',
    cargo: 'Administrador',
    sucursal: 'Botica Central'
  },
  {
    id: 2,
    nombre: 'Lucía Torres',
    email: 'trabajador@novasalud.pe',
    password: 'trabajador123',
    rol: 'trabajador',
    cargo: 'Trabajadora',
    sucursal: 'Botica Central'
  }
]

export const tiposAcceso = [
  {
    id: 'usuario',
    etiqueta: 'Trabajador',
    descripcion: 'Acceso operativo para ventas y atención al cliente',
    rol: 'trabajador'
  },
  {
    id: 'admin',
    etiqueta: 'Administrador',
    descripcion: 'Acceso completo a la gestión de la botica',
    rol: 'admin'
  }
]
