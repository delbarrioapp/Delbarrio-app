import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { actualizarProducto, borrarProducto } from '../lib/api'

export default function EditarProducto() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [form, setForm] = useState(null)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => { cargar() }, [id])

  async function cargar() {
    const { data, error } = await supabase
      .from('productos')
      .select('*')
      .eq('id', id)
      .single()
    if (error) return setError(error.message)
    setForm({
      nombre: data.nombre,
      precio: data.precio,
      stock_actual: data.stock_actual,
      stock_minimo: data.stock_minimo,
      unidad: data.unidad,
      categoria: data.categoria || '',
      fecha_vencimiento: data.fecha_vencimiento || ''
    })
  }

  function cambiar(campo, valor) {
    setForm({ ...form, [campo]: valor })
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.nombre) return setError('Pone un nombre')
    setGuardando(true)
    setError(null)
    try {
      await actualizarProducto(id, {
        nombre: form.nombre,
        precio: Number(form.precio) || 0,
        stock_actual: Number(form.stock_actual) || 0,
        stock_minimo: Number(form.stock_minimo) || 0,
        unidad: form.unidad,
        categoria: form.categoria.trim() || 'Sin categoria',
        fecha_vencimiento: form.fecha_vencimiento || null
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
    setGuardando(false)
  }

  async function eliminar() {
    if (!confirm('Borrar este producto?')) return
    try {
      await borrarProducto(id)
      navigate('/')
    } catch (err) {
      setError(err.message)
    }
  }

  if (error && !form) {
    return (
      <div className="p-4">
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
          {error}
        </div>
      </div>
    )
  }

  if (!form) {
    return <p className="p-4 text-center text-gray-500">Cargando...</p>
  }

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4 text-barrio-700">Editar producto</h1>

      <form onSubmit={guardar} className="space-y-3">
        <input
          type="text"
          placeholder="Nombre"
          value={form.nombre}
          onChange={e => cambiar('nombre', e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-200 text-lg"
        />

        <input
          type="text"
          placeholder="Categoria"
          value={form.categoria}
          onChange={e => cambiar('categoria', e.target.value)}
          list="categorias-sugeridas"
          className="w-full p-3 rounded-xl border border-gray-200 text-lg"
        />
        <datalist id="categorias-sugeridas">
          <option value="Bebidas" />
          <option value="Golosinas" />
          <option value="Galletitas" />
          <option value="Cigarrillos" />
          <option value="Snacks" />
          <option value="Lacteos" />
          <option value="Panaderia" />
          <option value="Almacen" />
          <option value="Limpieza" />
          <option value="Frutos secos" />
          <option value="Semillas" />
          <option value="Dietetica" />
        </datalist>

        <input
          type="number"
          step="0.01"
          placeholder="Precio"
          value={form.precio}
          onChange={e => cambiar('precio', e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-200 text-lg"
        />

        <div className="flex gap-3">
          <input
            type="number"
            step="0.001"
            placeholder="Stock actual"
            value={form.stock_actual}
            onChange={e => cambiar('stock_actual', e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-200 text-lg"
          />
          <input
            type="number"
            step="0.001"
            placeholder="Stock minimo"
            value={form.stock_minimo}
            onChange={e => cambiar('stock_minimo', e.target.value)}
            className="flex-1 p-3 rounded-xl border border-gray-200 text-lg"
          />
        </div>

        <select
          value={form.unidad}
          onChange={e => cambiar('unidad', e.target.value)}
          className="w-full p-3 rounded-xl border border-gray-200 text-lg bg-white"
        >
          <option value="unidad">Unidad</option>
          <option value="kg">Kilogramo</option>
          <option value="g">Gramo</option>
          <option value="litro">Litro</option>
          <option value="pack">Pack</option>
        </select>

        <div>
          <label className="text-sm text-gray-600 block mb-1">Fecha de vencimiento</label>
          <input
            type="date"
            value={form.fecha_vencimiento}
            onChange={e => cambiar('fecha_vencimiento', e.target.value)}
            className="w-full p-3 rounded-xl border border-gray-200 text-lg"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={guardando}
          className="w-full bg-barrio-500 text-white py-4 rounded-xl font-bold text-lg disabled:opacity-50"
        >
          {guardando ? 'Guardando...' : 'Guardar cambios'}
        </button>

        <button
          type="button"
          onClick={eliminar}
          className="w-full bg-red-50 text-red-600 py-3 rounded-xl font-semibold"
        >
          Borrar producto
        </button>
      </form>
    </div>
  )
}


