import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Ticket() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [venta, setVenta] = useState(null)
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    const { data, error } = await supabase
      .from('ventas')
      .select('*, venta_items(*)')
      .eq('id', id)
      .single()
    if (error) setError(error.message)
    else setVenta(data)
    setCargando(false)
  }

  function generarTexto() {
    if (!venta) return ''
    const fecha = new Date(venta.fecha).toLocaleString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
    let texto = '*delbarrio.com*\n'
    texto += fecha + '\n'
    texto += '------------------------\n'
    venta.venta_items.forEach(i => {
      texto += i.nombre_producto + ' x ' + Number(i.cantidad) + '\n'
      texto += '  $' + Number(i.subtotal).toLocaleString('es-AR') + '\n'
    })
    texto += '------------------------\n'
    texto += '*Total: $' + Number(venta.total).toLocaleString('es-AR') + '*\n'
    texto += 'Pago: ' + venta.metodo_pago + '\n\n'
    texto += 'Gracias por su compra!'
    return texto
  }

  function enviarWhatsApp() {
    const texto = encodeURIComponent(generarTexto())
    window.open('https://wa.me/?text=' + texto, '_blank')
  }

  function compartir() {
    const texto = generarTexto()
    if (navigator.share) {
      navigator.share({ text: texto })
    } else {
      enviarWhatsApp()
    }
  }

  if (cargando) {
    return <div className="text-center text-gray-400 py-12">Cargando...</div>
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

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Ticket
      </h1>

      <div className="bg-white dark:bg-stone-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-stone-800 mb-4">
        <div className="text-center border-b border-gray-100 dark:border-stone-800 pb-3 mb-3">
          <p className="font-bold text-lg text-gray-800 dark:text-gray-100">
            delbarrio.com
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {new Date(venta.fecha).toLocaleString('es-AR')}
          </p>
        </div>

        <div className="space-y-2 mb-3">
          {venta.venta_items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700 dark:text-gray-200">
                {i.nombre_producto} x {Number(i.cantidad)}
              </span>
              <span className="font-medium text-gray-800 dark:text-gray-100">
                ${Number(i.subtotal).toLocaleString('es-AR')}
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

      <button
        onClick={compartir}
        className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg mb-2 active:scale-[0.98] transition-transform"
      >
        Enviar por WhatsApp
      </button>

      <button
        onClick={() => navigate('/vender')}
        className="w-full bg-gray-100 dark:bg-stone-900 text-gray-700 dark:text-gray-200 py-3 rounded-xl font-semibold"
      >
        Volver a vender
      </button>
    </div>
  )
}


