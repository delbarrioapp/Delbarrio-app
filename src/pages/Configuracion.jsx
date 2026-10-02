import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerMiLocal, actualizarMiLocal } from '../lib/api'

export default function Configuracion() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    nombre: '',
    telefono: '',
    direccion: '',
    cuit: '',
    cbu: '',
    alias: '',
    link_mp: '',
    instagram: '',
    mensaje_ticket: ''
  })
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [mensaje, setMensaje] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const local = await obtenerMiLocal()
      setForm({
        nombre: local.nombre || '',
        telefono: local.telefono || '',
        direccion: local.direccion || '',
        cuit: local.cuit || '',
        cbu: local.cbu || '',
        alias: local.alias || '',
        link_mp: local.link_mp || '',
        instagram: local.instagram || '',
        mensaje_ticket: local.mensaje_ticket || ''
      })
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)
    setGuardando(true)
    try {
      await actualizarMiLocal({
        nombre: form.nombre.trim(),
        telefono: form.telefono.trim() || null,
        direccion: form.direccion.trim() || null,
        cuit: form.cuit.trim() || null,
        cbu: form.cbu.trim() || null,
        alias: form.alias.trim() || null,
        link_mp: form.link_mp.trim() || null,
        instagram: form.instagram.trim() || null,
        mensaje_ticket: form.mensaje_ticket.trim() || null
      })
      setMensaje('Cambios guardados correctamente')
      setTimeout(() => setMensaje(null), 2500)
    } catch (e) {
      setError(e.message)
    }
    setGuardando(false)
  }

  const inputClass = "w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:border-barrio-500"
  const labelClass = "block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-1 ml-1"

  if (cargando) {
    return (
      <div className="text-center text-gray-400 py-12">Cargando...</div>
    )
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-1">
        Mi local
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Configura los datos de tu local
      </p>

      {mensaje && (
        <div className="bg-emerald-50 dark:bg-emerald-950 border border-emerald-200 dark:border-emerald-900 rounded-xl p-3 mb-4 text-emerald-700 dark:text-emerald-300 text-sm">
          ✅ {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-3 mb-4 text-red-700 dark:text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={guardar} className="space-y-4">
        <div>
          <label className={labelClass}>Nombre del local *</label>
          <input
            type="text"
            placeholder="Ej: FranuShop"
            value={form.nombre}
            onChange={e => cambiar('nombre', e.target.value)}
            className={inputClass}
            required
          />
        </div>

        <div>
          <label className={labelClass}>Teléfono / WhatsApp</label>
          <input
            type="tel"
            placeholder="Ej: 1145678900"
            value={form.telefono}
            onChange={e => cambiar('telefono', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Dirección</label>
          <input
            type="text"
            placeholder="Ej: Av. Rivadavia 1234, CABA"
            value={form.direccion}
            onChange={e => cambiar('direccion', e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>Instagram</label>
          <input
            type="text"
            placeholder="Ej: @franushop"
            value={form.instagram}
            onChange={e => cambiar('instagram', e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-stone-800">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            💰 Datos de cobro (para el ticket)
          </p>

          <div className="space-y-4">
            <div>
              <label className={labelClass}>CUIT</label>
              <input
                type="text"
                placeholder="Ej: 20-12345678-9"
                value={form.cuit}
                onChange={e => cambiar('cuit', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>CBU</label>
              <input
                type="text"
                placeholder="Ej: 0170099220000067891234"
                value={form.cbu}
                onChange={e => cambiar('cbu', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Alias</label>
              <input
                type="text"
                placeholder="Ej: franushop.mp"
                value={form.alias}
                onChange={e => cambiar('alias', e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Link de Mercado Pago</label>
              <input
                type="url"
                placeholder="Ej: https://link.mercadopago.com.ar/franushop"
                value={form.link_mp}
                onChange={e => cambiar('link_mp', e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-stone-800">
          <label className={labelClass}>Mensaje al pie del ticket</label>
          <textarea
            placeholder="Ej: ¡Gracias por tu compra! Volvé pronto 💚"
            value={form.mensaje_ticket}
            onChange={e => cambiar('mensaje_ticket', e.target.value)}
            rows={3}
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  )
}


