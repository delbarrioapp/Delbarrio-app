import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { listarProductos, actualizarPromo, borrarPromo } from '../lib/api'

const TIPOS = [
  { id: 'cantidad', label: '2x1 / 3x2', icon: '🎁' },
  { id: 'porcentaje', label: 'Descuento %', icon: '💯' },
  { id: 'combo', label: 'Combo', icon: '🎯' }
]

export default function EditarPromo() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const [tipo, setTipo] = useState(null)
  const [nombre, setNombre] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [activa, setActiva] = useState(true)

  const [productoId, setProductoId] = useState('')
  const [lleva, setLleva] = useState(2)
  const [paga, setPaga] = useState(1)
  const [categoria, setCategoria] = useState('')
  const [descuento, setDescuento] = useState(10)
  const [productosCombo, setProductosCombo] = useState([])
  const [precioCombo, setPrecioCombo] = useState('')

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    setCargando(true)
    try {
      const { data: prods } = await listarProductos()
      setProductos(prods || [])

      const { data: promo, error: errP } = await supabase
        .from('promos')
        .select('*')
        .eq('id', id)
        .single()
      if (errP) throw errP

      setNombre(promo.nombre || '')
      setTipo(promo.tipo)
      setFechaHasta(promo.fecha_hasta || '')
      setActiva(promo.activa)

      const c = promo.config || {}
      if (promo.tipo === 'cantidad') {
        setProductoId(c.producto_id || '')
        setLleva(c.lleva || 2)
        setPaga(c.paga || 1)
      } else if (promo.tipo === 'porcentaje') {
        setCategoria(c.categoria || '')
        setDescuento(c.descuento || 10)
      } else if (promo.tipo === 'combo') {
        setProductosCombo(c.productos || [])
        setPrecioCombo(c.precio_combo || '')
      }
    } catch (e) {
      setError(e.message)
    }
    setCargando(false)
  }

  const categorias = [...new Set(productos.map(p => p.categoria).filter(Boolean))].sort()

  function toggleProductoCombo(pid) {
    if (productosCombo.includes(pid)) {
      setProductosCombo(productosCombo.filter(x => x !== pid))
    } else {
      setProductosCombo([...productosCombo, pid])
    }
  }

  async function guardar(e) {
    e.preventDefault()
    setError(null)

    if (!nombre.trim()) return setError('Ponele un nombre a la promo')
    if (!tipo) return setError('Elegi el tipo de promo')

    let config = {}
    if (tipo === 'cantidad') {
      if (!productoId) return setError('Elegi el producto')
      if (Number(lleva) < 2 || Number(paga) < 1 || Number(paga) >= Number(lleva)) {
        return setError('Config invalida')
      }
      config = { producto_id: productoId, lleva: Number(lleva), paga: Number(paga) }
    } else if (tipo === 'porcentaje') {
      if (!categoria) return setError('Elegi una categoria')
      if (Number(descuento) <= 0 || Number(descuento) >= 100) return setError('Descuento entre 1 y 99')
      config = { categoria, descuento: Number(descuento) }
    } else if (tipo === 'combo') {
      if (productosCombo.length < 2) return setError('Elegi 2 o mas productos')
      if (!precioCombo || Number(precioCombo) <= 0) return setError('Pone un precio')
      config = { productos: productosCombo, precio_combo: Number(precioCombo) }
    }

    setGuardando(true)
    try {
      await actualizarPromo(id, {
        nombre: nombre.trim(),
        tipo,
        config,
        fecha_hasta: fechaHasta || null,
        activa
      })
      navigate('/promos')
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  async function eliminar() {
    if (!confirm('Borrar la promo "' + nombre + '"?')) return
    try {
      await borrarPromo(id)
      navigate('/promos')
    } catch (err) {
      setError(err.message)
    }
  }

  const inputClass = "w-full p-3 rounded-xl bg-gray-50 dark:bg-stone-900 border border-gray-200 dark:border-stone-800 text-gray-800 dark:text-gray-100 text-base focus:outline-none focus:border-barrio-500"

  if (cargando) {
    return <div className="text-center text-gray-400 py-12">Cargando...</div>
  }

  return (
    <div className="px-4 pt-5 pb-24">
      <h1 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">
        Editar promo
      </h1>

      <form onSubmit={guardar} className="space-y-4">
        <input
          type="text"
          placeholder="Nombre"
          value={nombre}
          onChange={e => setNombre(e.target.value)}
          className={inputClass}
        />

        <div>
          <label className="block text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
            Tipo
          </label>
          <div className="grid grid-cols-3 gap-2">
            {TIPOS.map(t => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTipo(t.id)}
                className={
                  'p-3 rounded-xl text-center border-2 transition-colors ' +
                  (tipo === t.id
                    ? 'border-barrio-500 bg-barrio-50 dark:bg-stone-800'
                    : 'border-gray-200 dark:border-stone-800 bg-white dark:bg-stone-900')
                }
              >
                <div className="text-2xl mb-1">{t.icon}</div>
                <div className="text-xs font-semibold text-gray-800 dark:text-gray-100">
                  {t.label}
                </div>
              </button>
            ))}
          </div>
        </div>

        {tipo === 'cantidad' && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-stone-900 rounded-xl">
            <select
              value={productoId}
              onChange={e => setProductoId(e.target.value)}
              className={inputClass}
            >
              <option value="">Elegir producto...</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>
                  {p.nombre} — ${Number(p.precio).toLocaleString('es-AR')}
                </option>
              ))}
            </select>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Lleva
                </label>
                <input
                  type="number"
                  min="2"
                  value={lleva}
                  onChange={e => setLleva(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                  Paga
                </label>
                <input
                  type="number"
                  min="1"
                  value={paga}
                  onChange={e => setPaga(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        )}

        {tipo === 'porcentaje' && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-stone-900 rounded-xl">
            <select
              value={categoria}
              onChange={e => setCategoria(e.target.value)}
              className={inputClass}
            >
              <option value="">Elegir categoria...</option>
              {categorias.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Descuento (%)
              </label>
              <input
                type="number"
                min="1"
                max="99"
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        {tipo === 'combo' && (
          <div className="space-y-3 p-4 bg-gray-50 dark:bg-stone-900 rounded-xl">
            <label className="text-sm font-semibold text-gray-600 dark:text-gray-300 block">
              Productos del combo
            </label>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {productos.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => toggleProductoCombo(p.id)}
                  className={
                    'w-full p-2 rounded-lg text-left text-sm flex justify-between items-center ' +
                    (productosCombo.includes(p.id)
                      ? 'bg-barrio-100 dark:bg-stone-800 text-barrio-700 dark:text-barrio-500 font-semibold'
                      : 'bg-white dark:bg-stone-950 text-gray-700 dark:text-gray-300')
                  }
                >
                  <span className="truncate">{p.nombre}</span>
                  {productosCombo.includes(p.id) && <span>✓</span>}
                </button>
              ))}
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                Precio del combo
              </label>
              <input
                type="number"
                step="0.01"
                value={precioCombo}
                onChange={e => setPrecioCombo(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}

        <div>
          <label className="text-sm text-gray-600 dark:text-gray-400 block mb-1 ml-1">
            Vence (opcional)
          </label>
          <input
            type="date"
            value={fechaHasta}
            onChange={e => setFechaHasta(e.target.value)}
            className={inputClass}
          />
        </div>

        <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-stone-900 rounded-xl cursor-pointer">
          <input
            type="checkbox"
            checked={activa}
            onChange={e => setActiva(e.target.checked)}
            className="w-5 h-5"
          />
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
            Promo activa
          </span>
        </label>

        {error && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-900 rounded-xl p-3 text-red-700 dark:text-red-300 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-40 active:scale-[0.98] transition-transform"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button
          type="button"
          onClick={eliminar}
          className="w-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 py-3 rounded-xl font-semibold"
        >
          Borrar promo
        </button>
      </form>
    </div>
  )
}


