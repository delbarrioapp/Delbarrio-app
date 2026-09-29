import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [local, setLocal] = useState(null)
  const [esAdmin, setEsAdmin] = useState(false)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    cargarSesion()

    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user)
        await cargarLocal(session.user.id)
      } else {
        setUser(null)
        setLocal(null)
        setEsAdmin(false)
      }
    })

    return () => listener?.subscription?.unsubscribe()
  }, [])

  async function cargarSesion() {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.user) {
      setUser(session.user)
      await cargarLocal(session.user.id)
    }
    setCargando(false)
  }

  async function cargarLocal(userId) {
    const { data, error } = await supabase
      .from('usuarios')
      .select('*, locales(*)')
      .eq('id', userId)
      .maybeSingle()
    if (!error && data) {
      setLocal({ ...data.locales, usuario: data })
      setEsAdmin(data.es_admin === true)
    } else {
      setLocal(null)
      setEsAdmin(false)
    }
  }

  async function registrarse(email, password, nombreLocal) {
    const { data, error } = await supabase.auth.signUp({ email, password })
    if (error) throw error

    if (data.user) {
      const { data: localCreado, error: errLocal } = await supabase
        .from('locales')
        .insert({ nombre: nombreLocal, tipo: 'otro' })
        .select()
        .single()
      if (errLocal) throw errLocal

      const { error: errUser } = await supabase
        .from('usuarios')
        .insert({
          id: data.user.id,
          local_id: localCreado.id,
          nombre: nombreLocal,
          rol: 'dueño'
        })
      if (errUser) throw errUser

      setLocal({ ...localCreado, usuario: { id: data.user.id, nombre: nombreLocal, rol: 'dueño' } })
      setEsAdmin(false)
    }
    return data
  }

  async function iniciarSesion(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) throw error
    return data
  }

  async function cerrarSesion() {
    await supabase.auth.signOut()
    setUser(null)
    setLocal(null)
    setEsAdmin(false)
  }

  return (
    <AuthContext.Provider value={{
      user,
      local,
      esAdmin,
      cargando,
      registrarse,
      iniciarSesion,
      cerrarSesion
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}


