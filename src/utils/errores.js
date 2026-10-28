export const mensajeDeError = (error) => {
  if (error?.status === 403 || error?.codigo === 'SIN_PERMISO') {
    return 'No tienes permiso para realizar esta acción'
  }
  return error?.mensaje || error?.message || 'Ocurrió un error inesperado.'
}
