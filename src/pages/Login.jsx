import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { iniciarSesion, registrarse } = useAuth()
  const [modo, setModo] = useState('login') // login | registro
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nombreLocal, setNombreLocal] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(null)

  async function enviar(e) {
    e.preventDefault()
    setCargando(true)
    setError(null)
    try {
      if (modo === 'login') {
        await iniciarSesion(email.trim(), password)
      } else {
        if (!nombreLocal.trim()) {
          setError('Pone el nombre de tu local')
          setCargando(false)
          return
        }
        await registrarse(email.trim(), password, nombreLocal.trim())
      }
    } catch (err) {
      setError(err.message || 'Error al conectar')
    }
    setCargando(false)
  }

  const inputClass = "w-full p-4 rounded-xl bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:border-barrio-500"

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-12 bg-stone-50 dark:bg-stone-950">
      <div className="w-full max-w-sm mx-auto">
        <div className="flex justify-center mb-8">
          <img
            src="/logo.png"
            alt="delbarrio.com"
            className="h-32 object-contain"
          />
        </div>

        <h1 className="text-2xl font-bold text-center text-gray-800 dark:text-gray-100 mb-2">
          {modo === 'login' ? 'Iniciar sesion' : 'Crear cuenta'}
        </h1>
        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6">
          {modo === 'login'
            ? 'Entra con tu cuenta'
            : 'Registra tu local gratis'}
        </p>

        <form onSubmit={enviar} className="space-y-3">
          {modo === 'registro' && (
            <input
              type="text"
              placeholder="Nombre de tu local"
              value={nombreLocal}
              onChange={e => setNombreLocal(e.target.value)}
              className={inputClass}
              autoComplete="organization"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className={inputClass}
            autoComplete="email"
            required
          />

          <input
            type="password"
            placeholder="Contrasena"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className={inputClass}
            autoComplete={modo === 'login' ? 'current-password' : 'new-password'}
            required
            minLength={6}
          />

          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
          >
            {cargando
              ? 'Cargando...'
              : modo === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>

        <button
          onClick={() => {
            setModo(modo === 'login' ? 'registro' : 'login')
            setError(null)
          }}
          className="w-full mt-4 text-sm text-barrio-600 dark:text-barrio-500 font-semibold py-3"
        >
          {modo === 'login'
            ? '¿No tenes cuenta? Crear una gratis'
            : '¿Ya tenes cuenta? Iniciar sesion'}
        </button>
      </div>
    </div>
  )
}


