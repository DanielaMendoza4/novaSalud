import { request, mockDelay, useMocks } from './http'
import { mockLogin, mockMe } from './mocks/authMocks'

export const authService = {
  login: (credentials) =>
    useMocks ? mockDelay(mockLogin(credentials)) : request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    }),
  me: () => (useMocks ? mockDelay(mockMe()) : request('/auth/me'))
}
