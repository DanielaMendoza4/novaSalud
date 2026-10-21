import { createContext } from 'react'

export const AuthContext = createContext(null)
export { AuthProvider } from './AuthProvider'
export { useAuth } from './useAuth'
export default AuthContext
