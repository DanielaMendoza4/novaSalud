
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import { tiposAcceso, usuariosDemo } from '../../data/usuarios'
import logoFarmacia from '../../assets/images/logo-farmacia.jpg'
import Button from '../Button/Button'
import './Login.css'

const CURRENT_YEAR = new Date().getFullYear()

/**
 * Login de Nova Salud:
 * - Trabajador: acceso operativo.
 * - Administrador: acceso completo.
 */
export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mostrarPassword, setMostrarPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const [tipoAcceso, setTipoAcceso] = useState(
    tiposAcceso[0]?.id ?? 'usuario'
  )

  const accesoActivo =
    tiposAcceso.find((tipo) => tipo.id === tipoAcceso) ??
    tiposAcceso[0]

  const cuentaDemo = usuariosDemo.find(
    (cuenta) => cuenta.rol === accesoActivo?.rol
  )

  if (usuario) {
    return <Navigate to="/" replace />
  }

  const cambiarAcceso = (id) => {
    setTipoAcceso(id)
    setError('')
  }

  const usarCredencialesDemo = () => {
    if (!cuentaDemo) return

    setEmail(cuentaDemo.email)
    setPassword(cuentaDemo.password)
    setError('')
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña para continuar.')
      return
    }

    setLoading(true)

    try {
      await login({
        email: email.trim(),
        password,
        rolEsperado: accesoActivo.rol
      })

      navigate('/', { replace: true })
    } catch (loginError) {
      setError(
        loginError.message || 'No se pudo iniciar sesión.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <aside className="login-brand-panel">
        <div className="login-brand-top">
          <div className="login-logo">
            <img className="login-brand-image" src={logoFarmacia} alt="Logo de Nova Salud Botica" />
          </div>

          <span className="login-brand-badge">
            Sistema integral
          </span>
        </div>

        <div className="login-brand-copy">
          <p className="login-eyebrow">
            Panel de gestión farmacéutica
          </p>

          <h2>
            Tu botica, <em>organizada</em> y bajo control.
          </h2>

          <p>
            Inventario, punto de venta, alertas de vencimiento y
            reportes en una sola plataforma pensada para el día a
            día de tu farmacia.
          </p>

          <ul className="login-feature-list">
            <li>Control de stock y lotes en tiempo real</li>
            <li>Alertas de quiebre y próximos vencimientos</li>
            <li>Punto de venta rápido con lector de códigos</li>
          </ul>
        </div>

        <div className="login-brand-footer">
          <span className="login-status-dot" />
          Sistema disponible · Botica Central
        </div>
      </aside>

      <main className="login-form-panel">
        <div className="login-mobile-brand">
          <div className="login-logo login-logo-compact">
            <img className="login-brand-image" src={logoFarmacia} alt="Logo de Nova Salud Botica" />
          </div>
        </div>

        <div className="login-card">
          <header className="login-card-header">
            <span className="login-eyebrow">
              Acceso al sistema
            </span>
            <h1>Bienvenido de vuelta</h1>
            <p>
              Selecciona tu tipo de acceso e inicia sesión.
            </p>
          </header>

          <div
            className="login-tabs"
            role="tablist"
            aria-label="Tipo de acceso"
          >
            {tiposAcceso.map((tipo) => (
              <button
                key={tipo.id}
                type="button"
                role="tab"
                aria-selected={tipoAcceso === tipo.id}
                className={`login-tab ${
                  tipoAcceso === tipo.id ? 'active' : ''
                }`}
                onClick={() => cambiarAcceso(tipo.id)}
                disabled={loading}
              >
                {tipo.etiqueta}
              </button>
            ))}
          </div>

          <p className="login-access-description">
            {accesoActivo?.descripcion}
          </p>

          <form
            className="login-form"
            onSubmit={handleSubmit}
            noValidate
          >
            <div className="login-field">
              <label htmlFor="login-email">
                Correo electrónico
              </label>

              <div className="login-input-wrapper">
                <svg
                  className="login-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect
                    x="3"
                    y="5"
                    width="18"
                    height="14"
                    rx="2"
                  />
                  <path d="m3 7 9 6 9-6" />
                </svg>

                <input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  placeholder={
                    accesoActivo?.rol === 'admin'
                      ? 'admin@novasalud.pe'
                      : 'trabajador@novasalud.pe'
                  }
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  disabled={loading}
                  required
                />
              </div>
            </div>

            <div className="login-field">
              <label htmlFor="login-password">
                Contraseña
              </label>

              <div className="login-input-wrapper">
                <svg
                  className="login-input-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  aria-hidden="true"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="login-password"
                  type={mostrarPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="Ingresa tu contraseña"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  disabled={loading}
                  required
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setMostrarPassword((visible) => !visible)
                  }
                  aria-label={
                    mostrarPassword
                      ? 'Ocultar contraseña'
                      : 'Mostrar contraseña'
                  }
                  disabled={loading}
                >
                  {mostrarPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error && (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={loading}
            >
              Iniciar sesión
            </Button>
          </form>

          <div className="login-demo-card">
            <div className="login-demo-header">
              <span className="login-demo-badge">Demo</span>
              <span>Credenciales de demostración</span>
            </div>

            {cuentaDemo ? (
              <>
                <div className="login-demo-credentials">
                  <code>{cuentaDemo.email}</code>
                  <span>·</span>
                  <code>{cuentaDemo.password}</code>
                </div>

                <button
                  type="button"
                  className="login-demo-button"
                  onClick={usarCredencialesDemo}
                  disabled={loading}
                >
                  Autocompletar credenciales
                </button>
              </>
            ) : (
              <p>
                No hay credenciales demo configuradas para este rol.
              </p>
            )}
          </div>

          <p className="login-security-note">
            Acceso de demostración para fines académicos. No utilices
            credenciales reales en el modo mock.
          </p>
        </div>

        <footer className="login-footer">
          © {CURRENT_YEAR} Nova Salud — Sistema Integral de Gestión
          Farmacéutica
        </footer>
      </main>
    </div>
  )
}
