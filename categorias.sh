#!/bin/bash
URL="https://msfxkwguazjafwqsrafa.supabase.co/rest/v1/productos"
KEY="sb_publishable_0TXgA31JXP61jl5Hvx_Www_zFb6UJGm"

actualizar() {
  curl -s -X PATCH "$URL?nombre=eq.$1" \
    -H "apikey: $KEY" \
    -H "Authorization: Bearer $KEY" \
    -H "Content-Type: application/json" \
    -d "{\"categoria\":\"$2\"}"
  echo " -> $1 = $2"
}

echo "Actualizando categorias..."
actualizar "Coca-Cola%20500ml" "Bebidas"
actualizar "Agua%20mineral%20500ml" "Bebidas"
actualizar "Alfajor%20Jorgito" "Golosinas"
actualizar "Galletitas%20Oreo" "Galletitas"
actualizar "Almendras" "Frutos%20secos"
actualizar "Pan%20lactal" "Panaderia"
echo "Listo!"
