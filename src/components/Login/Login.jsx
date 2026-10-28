import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context'
import './Login.css'

import logo from '../../assets/LOGO.jpeg';

// Icons inline (solo CSS class login__icon, sin dependencias externas)
const CheckIcon = () => (
  <svg className="login__icon" viewBox="0 0 20 20" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="10" cy="10" r="8" /><path d="M6.5 10.2l2.4 2.4 4.6-5" />
  </svg>
);

const LockIcon = () => (
  <svg className="login__icon login__icon--sm" viewBox="0 0 16 16" fill="none" stroke="currentColor"
       strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="3" y="7" width="10" height="7" rx="2" /><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
  </svg>
);

const FEATURES = [
  { title: 'Stock', text: 'Control en tiempo real' },
  { title: 'Vencimientos', text: 'Alertas anticipadas' },
  { title: 'Quiebres', text: 'Reposición a tiempo' },
];

export default function Login() {
  const { usuario, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  if (usuario) return <Navigate to="/" replace />

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    if (!email.trim() || !password) {
      setError('Ingresa tu correo y contraseña para continuar.')
      return
    }
    setLoading(true)
    try {
      await login({ email, password })
      navigate('/', { replace: true })
    } catch (loginError) {
      setError(loginError.message || 'No se pudo iniciar sesión.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="login">
      <section className="login__brand">
        <div className="login__logo">
          <img className="login__logo-img" src={logo} alt="Nova Salud Botica" />
        </div>

        <p className="login__headline">
          Inventario claro.
          <span className="login__rotator">
            <span>Ventas ágiles.</span>
            <span aria-hidden="true">Stock al día.</span>
            <span aria-hidden="true">Cero quiebres.</span>
          </span>
        </p>

        <ul className="login__cards">
          {FEATURES.map((f) => (
            <li className="login__card" key={f.title}>
              <span className="login__card-icon"><CheckIcon /></span>
              <strong>{f.title}</strong>
              <span>{f.text}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="login__divider" aria-hidden="true" />

      <section className="login__panel">
        <div className="login__form-card">
          <p className="login__eyebrow">ACCESO AL SISTEMA</p>
          <h1 className="login__title">Bienvenido de vuelta</h1>
          <p className="login__subtitle">Ingresa tus credenciales para continuar.</p>

          <form className="login__form" onSubmit={handleSubmit} noValidate>
            <div className="login__field">
              <label className="login__label" htmlFor="login-email">Correo electrónico</label>
              <input className="login__input" id="login-email" type="email" autoComplete="username"
                     placeholder="vendedor@novasalud.pe" value={email} onChange={e => setEmail(e.target.value)} />
            </div>

            <div className="login__field">
              <label className="login__label" htmlFor="login-password">Contraseña</label>
              <div className="login__pass">
                <input className="login__input login__input--pass" id="login-password"
                       type={showPassword ? 'text' : 'password'} autoComplete="current-password"
                     placeholder="Ingresa tu contraseña" value={password} onChange={e => setPassword(e.target.value)} />
                <button type="button" className="login__toggle"
                        onClick={() => setShowPassword((v) => !v)}
                        aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
            </div>

            {error && <p className="login__error" role="alert">{error}</p>}

            <button type="submit" className="login__submit" disabled={loading}>
              {loading ? 'Ingresando…' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="login__secure"><LockIcon /> Acceso seguro para el personal de la botica</p>
        </div>
      </section>
    </main>
  )
}