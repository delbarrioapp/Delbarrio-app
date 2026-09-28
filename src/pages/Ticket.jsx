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

  if (cargando) return <p className="p-4 text-center text-gray-500">Cargando...</p>
  if (error) return <p className="p-4 text-center text-red-600">{error}</p>
  if (!venta) return null

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Ticket</h1>

      <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
        <div className="text-center border-b pb-3 mb-3">
          <p className="font-bold text-lg">delbarrio.com</p>
          <p className="text-xs text-gray-500">
            {new Date(venta.fecha).toLocaleString('es-AR')}
          </p>
        </div>

        <div className="space-y-2 mb-3">
          {venta.venta_items.map((i, idx) => (
            <div key={idx} className="flex justify-between text-sm">
              <span className="text-gray-700">
                {i.nombre_producto} x {Number(i.cantidad)}
              </span>
              <span className="font-medium">
                ${Number(i.subtotal).toLocaleString('es-AR')}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t pt-3 flex justify-between items-center">
          <span className="font-bold text-gray-700">TOTAL</span>
          <span className="font-bold text-xl text-barrio-700">
            ${Number(venta.total).toLocaleString('es-AR')}
          </span>
        </div>
        <p className="text-xs text-gray-500 text-center mt-2">
          Pago: {venta.metodo_pago}
        </p>
      </div>

      <button
        onClick={compartir}
        className="w-full bg-green-500 text-white py-4 rounded-xl font-bold text-lg mb-2"
      >
        Enviar por WhatsApp
      </button>

      <button
        onClick={() => navigate('/vender')}
        className="w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-semibold"
      >
        Volver a vender
      </button>
    </div>
  )
}


