import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { supabase } from '../lib/supabase'

export default function Ticket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [venta, setVenta] = useState(null)
  const [local, setLocal] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    try {
      const { data: v, error: errV } = await supabase
        .from('ventas')
        .select('*, venta_items(*)')
        .eq('id', id)
        .single()
      if (errV) throw errV
      setVenta(v)

      const { data: u } = await supabase.auth.getUser()
      if (u?.user) {
        const { data: usr } = await supabase
          .from('usuarios')
          .select('local_id')
          .eq('id', u.user.id)
          .single()
        if (usr?.local_id) {
          const { data: loc } = await supabase
            .from('locales')
            .select('*')
            .eq('id', usr.local_id)
            .single()
          if (loc) setLocal(loc)
        }
      }
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  function urlTicket() {
    if (!venta?.token_publico) return ''
    return window.location.origin + '/t/' + venta.token_publico
  }

  function enviarWhatsApp() {
    if (!venta) return
    const fecha = new Date(venta.fecha).toLocaleString('es-AR')
    let texto = '*Ticket - ' + (local?.nombre || 'delbarrio.com') + '*\n'
    texto += fecha + '\n'
    texto += '------------------------\n'
    venta.venta_items.forEach(i => {
      texto += i.nombre_producto + ' x ' + Number(i.cantidad) + '\n'
      texto += '  $' + Number(i.subtotal).toLocaleString('es-AR') + '\n'
    })
    texto += '------------------------\n'
    texto += '*Total: $' + Number(venta.total).toLocaleString('es-AR') + '*\n'
    texto += 'Pago: ' + venta.metodo_pago + '\n\n'
    texto += 'Ver ticket online: ' + urlTicket()
    window.open('https://wa.me/?text=' + encodeURIComponent(texto), '_blank')
  }

  function nuevaVenta() {
    navigate('/vender')
  }

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
        <p className="text-gray-400">Cargando ticket...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-4 text-red-700 dark:text-red-300">
          {error}
        </div>
      </div>
    )
  }

  if (!venta) return null

  const items = venta.venta_items || []

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 py-4 px-4">
      <div className="max-w-md mx-auto">
        <div className="bg-emerald-500 text-white rounded-2xl p-4 mb-4 text-center">
          <p className="text-3xl mb-1">✅</p>
          <p className="font-bold text-lg">Venta registrada</p>
          <p className="text-sm opacity-90">
            ${Number(venta.total).toLocaleString('es-AR')}
          </p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm overflow-hidden mb-4">
          <div className="bg-barrio-500 text-white text-center p-4">
            <p className="text-xl font-bold">{local?.nombre || 'Local'}</p>
            <p className="text-xs opacity-90 mt-1">
              {new Date(venta.fecha).toLocaleString('es-AR')}
            </p>
            {local?.telefono && (
              <p className="text-xs opacity-90">📞 {local.telefono}</p>
            )}
            {local?.direccion && (
              <p className="text-xs opacity-90">📍 {local.direccion}</p>
            )}
          </div>

          <div className="p-4">
            <div className="space-y-2 mb-4">
              {items.map((it, idx) => (
                <div key={idx} className="flex justify-between text-sm">
                  <span className="text-gray-700 dark:text-gray-200">
                    {it.nombre_producto}
                    <span className="text-gray-400"> × {Number(it.cantidad)}</span>
                  </span>
                  <span className="text-gray-800 dark:text-gray-100 font-medium">
                    ${Number(it.subtotal).toLocaleString('es-AR')}
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-100 dark:border-stone-800 pt-3 flex justify-between items-center">
              <span className="font-bold text-gray-700 dark:text-gray-200">TOTAL</span>
              <span className="font-bold text-xl text-barrio-600 dark:text-barrio-500">
                ${Number(venta.total).toLocaleString('es-AR')}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2 capitalize">
              Pago: {venta.metodo_pago}
            </p>
          </div>
        </div>

        {venta.token_publico && (
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-sm p-5 mb-4 text-center">
            <p className="text-sm font-bold text-gray-700 dark:text-gray-200 mb-3">
              📱 El cliente escanea este QR
            </p>
            <div className="bg-white p-3 rounded-xl inline-block">
              <QRCodeSVG value={urlTicket()} size={180} level="M" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
              Ve el ticket en su celular sin pedir WhatsApp
            </p>
          </div>
        )}

        <button
          onClick={nuevaVenta}
          className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg mb-2 active:scale-[0.98] transition-transform"
        >
          ✓ Listo, nueva venta
        </button>

        <button
          onClick={enviarWhatsApp}
          className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm mb-2"
        >
          📱 Enviar por WhatsApp (opcional)
        </button>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500 mt-3">
          Ticket digital por <b className="text-barrio-500">delbarrio.com</b>
        </p>
      </div>
    </div>
  )
}


