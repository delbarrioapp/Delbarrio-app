import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function TicketPublico() {
  const { token } = useParams()
  const [ticket, setTicket] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [token])

  async function cargar() {
    try {
      console.log('Token recibido:', token)
      
      // Asegurar sesion anonima
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        console.log('No hay sesion, creando anonima...')
        await supabase.auth.signInAnonymously()
      }

      const { data, error } = await supabase.rpc('obtener_ticket_publico', {
        p_token: token
      })
      
      console.log('Resultado RPC:', data)
      console.log('Error RPC:', error)
      
      if (error) throw error
      if (!data || !data.venta) {
        setError('Ticket no encontrado')
      } else {
        setTicket(data)
      }
    } catch (e) {
      console.error('Error:', e)
      setError(e.message)
    }
    setCargando(false)
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-gray-400">Cargando ticket...</p>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 p-6">
        <div className="bg-white dark:bg-stone-900 rounded-2xl p-6 text-center max-w-sm w-full">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-bold text-gray-800 dark:text-gray-100 mb-2">
            Ticket no encontrado
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {error || 'El link puede haber expirado o ser incorrecto'}
          </p>
        </div>
      </div>
    )
  }

  const { venta, local, items } = ticket
  const fecha = new Date(venta.fecha)

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-6 px-4">
      <div className="max-w-sm mx-auto">
        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm overflow-hidden">
          {venta.anulada && (
            <div className="bg-red-500 text-white text-center py-3 font-bold">
              ⚠️ VENTA ANULADA
            </div>
          )}

          <div className="bg-barrio-500 text-white text-center p-5">
            <p className="text-2xl font-bold mb-1">{local?.nombre || 'Local'}</p>
            <p className="text-xs opacity-90">
              {fecha.toLocaleDateString('es-AR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </p>
            <p className="text-xs opacity-90">
              {fecha.toLocaleTimeString('es-AR', {
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <div className="p-5">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
              Detalle
            </p>

            <div className="space-y-2 mb-4">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">
                    {it.nombre}
                    <span className="text-gray-400"> × {Number(it.cantidad)}</span>
                  </span>
                  <span className="text-gray-800 dark:text-gray-100 font-medium">
                    ${Number(it.subtotal).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-stone-800 pt-4 mb-3">
              <div className="flex justify-between items-center">
                <span className="font-bold text-gray-700 dark:text-gray-200">
                  TOTAL
                </span>
                <span className="font-bold text-2xl text-barrio-600 dark:text-barrio-500">
                  ${Number(venta.total).toLocaleString('es-AR')}
                </span>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 capitalize">
                Pago: {venta.metodo_pago}
              </p>
            </div>

            <div className="text-center pt-3 border-t border-gray-100 dark:border-stone-800">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                ¡Gracias por tu compra!
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500">
                💚 {local?.nombre || 'Local'}
              </p>
            </div>
          </div>

          <div className="bg-stone-100 dark:bg-stone-950 text-center py-3 border-t border-gray-100 dark:border-stone-800">
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">
              Ticket digital por <b className="text-barrio-500">delbarrio.com</b>
            </p>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-4">
          Guardá este link o compartilo
        </p>
      </div>
    </div>
  )
}


