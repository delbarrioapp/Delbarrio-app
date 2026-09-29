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

export async function guardarVenta(items, metodoPago, totalFinal, descuentos) {
  const total = totalFinal !== undefined
    ? totalFinal
    : items.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0)

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

export async function listarPromos() {
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .order('activa', { ascending: false })
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function crearPromo(promo) {
  const { data, error } = await supabase.rpc('crear_promo', {
    p_nombre: promo.nombre,
    p_tipo: promo.tipo,
    p_config: promo.config,
    p_fecha_hasta: promo.fecha_hasta || null
  })
  if (error) throw error
  return { id: data }
}

export async function actualizarPromo(id, cambios) {
  const { data, error } = await supabase
    .from('promos')
    .update(cambios)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function borrarPromo(id) {
  const { error } = await supabase
    .from('promos')
    .delete()
    .eq('id', id)
  if (error) throw error
}

export async function listarPromosActivas() {
  const hoy = new Date().toISOString().split('T')[0]
  const { data, error } = await supabase
    .from('promos')
    .select('*')
    .eq('activa', true)
    .or(`fecha_hasta.is.null,fecha_hasta.gte.${hoy}`)
  if (error) throw error
  return data || []
}

export function calcularDescuentos(carrito, promos) {
  const subtotal = carrito.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0)
  const descuentos = []
  const productosConPromo = new Set()

  for (const promo of promos) {
    if (promo.tipo !== 'combo') continue
    const c = promo.config || {}
    const prodsCombo = c.productos || []
    if (prodsCombo.length === 0) continue
    const todos = prodsCombo.every(pid => carrito.find(i => i.id === pid))
    if (!todos) continue

    let sumaNormal = 0
    const usados = []
    prodsCombo.forEach(pid => {
      const item = carrito.find(i => i.id === pid)
      if (item) {
        sumaNormal += Number(item.precio) * item.cantidad
        usados.push(pid)
      }
    })
    const precioCombo = Number(c.precio_combo) || 0
    if (sumaNormal > precioCombo) {
      descuentos.push({
        promo: promo.nombre,
        monto: sumaNormal - precioCombo,
        tipo: 'combo'
      })
      usados.forEach(id => productosConPromo.add(id))
    }
  }

  for (const promo of promos) {
    if (promo.tipo !== 'cantidad') continue
    const c = promo.config || {}
    if (productosConPromo.has(c.producto_id)) continue
    const item = carrito.find(i => i.id === c.producto_id)
    if (!item) continue
    const lleva = Number(c.lleva) || 2
    const paga = Number(c.paga) || 1
    const grupos = Math.floor(item.cantidad / lleva)
    if (grupos > 0) {
      descuentos.push({
        promo: promo.nombre,
        monto: grupos * (lleva - paga) * Number(item.precio),
        tipo: 'cantidad'
      })
      productosConPromo.add(c.producto_id)
    }
  }

  for (const promo of promos) {
    if (promo.tipo !== 'porcentaje') continue
    const c = promo.config || {}
    if (!c.categoria) continue
    const itemsCat = carrito.filter(i =>
      i.categoria === c.categoria && !productosConPromo.has(i.id)
    )
    if (itemsCat.length === 0) continue
    const subtotalCat = itemsCat.reduce((s, i) => s + Number(i.precio) * i.cantidad, 0)
    if (subtotalCat > 0) {
      descuentos.push({
        promo: promo.nombre,
        monto: subtotalCat * (Number(c.descuento) / 100),
        tipo: 'porcentaje'
      })
      itemsCat.forEach(i => productosConPromo.add(i.id))
    }
  }

  const totalDescuento = descuentos.reduce((s, d) => s + d.monto, 0)
  return { descuentos, totalDescuento, subtotal }
}

export async function obtenerMiLocalId() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No hay sesion')
  const { data, error } = await supabase
    .from('usuarios')
    .select('local_id')
    .eq('id', user.id)
    .single()
  if (error) throw error
  if (!data?.local_id) throw new Error('No tenes local asignado')
  return data.local_id
}


