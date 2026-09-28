import { supabase } from './supabase'

export async function listarProductos() {
  const { data, error } = await supabase
    .from('productos')
    .select('*')
    .eq('activo', true)
    .order('categoria')
    .order('nombre')
  if (error) throw error
  return data || []
}

export async function crearProducto(p) {
  const { data, error } = await supabase
    .from('productos')
    .insert(p)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function actualizarProducto(id, cambios) {
  const { data, error } = await supabase
    .from('productos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function borrarProducto(id) {
  const { error } = await supabase
    .from('productos')
    .update({ activo: false })
    .eq('id', id)
  if (error) throw error
}

export async function ajustarStock(id, delta) {
  const { data: actual } = await supabase
    .from('productos')
    .select('stock_actual')
    .eq('id', id)
    .single()
  const nuevo = Number(actual.stock_actual) + Number(delta)
  const { data, error } = await supabase
    .from('productos')
    .update({ stock_actual: nuevo })
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function guardarVenta(items, metodoPago) {
  const total = items.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0)

  const { data: venta, error } = await supabase
    .from('ventas')
    .insert({ total, metodo_pago: metodoPago })
    .select()
    .single()
  if (error) throw error

  const itemsData = items.map(i => ({
    venta_id: venta.id,
    producto_id: i.id,
    nombre_producto: i.nombre,
    cantidad: i.cantidad,
    precio_unitario: i.precio,
    subtotal: Number(i.precio) * i.cantidad
  }))

  const { error: errItems } = await supabase
    .from('venta_items')
    .insert(itemsData)
  if (errItems) throw errItems

  for (const item of items) {
    await ajustarStock(item.id, -item.cantidad)
  }

  return venta
}

export async function listarVentasHoy() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('ventas')
    .select('*, venta_items(*)')
    .gte('fecha', hoy.toISOString())
    .order('fecha', { ascending: false })
  if (error) throw error
  return data || []
}

export async function listarVentasEfectivoHoy() {
  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)
  const { data, error } = await supabase
    .from('ventas')
    .select('total')
    .eq('metodo_pago', 'efectivo')
    .gte('fecha', hoy.toISOString())
  if (error) throw error
  const total = (data || []).reduce((s, v) => s + Number(v.total), 0)
  return total
}

export async function guardarCierreCaja(datos) {
  const { data, error } = await supabase
    .from('cierres_caja')
    .insert(datos)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function listarCierres() {
  const { data, error } = await supabase
    .from('cierres_caja')
    .select('*')
    .order('fecha', { ascending: false })
    .limit(30)
  if (error) throw error
  return data || []
}


