# Lane 104 — Badge de nivel en el perfil

Pedido (textual): "Quiero usar los archivos webp. Cada uno está nombrado según el nivel que corresponde. Actualmente dashboard/perfil muestra un círculo con el porcentaje de completitud con una barra circular y dentro el texto. Me gustaría reemplazar eso por el badge y agregar una barra horizontal que se vaya completando según el porcentaje, y debajo el saldo de XP y debajo del saldo el texto "XX% al Nivel X"".

- Badges copiados de `\\10.0.0.104\OrdoDiei\Niveles` a `public/niveles/1..12.webp` (solo webp).
- `PerfilResumen.tsx`: el anillo circular se reemplazó por badge + `Progress` horizontal + `XX XP` + `NN% al Nivel N`.
- Hay badges 1–12; por encima del nivel 12 se muestra el del 12 (los niveles llegan a 30+).
