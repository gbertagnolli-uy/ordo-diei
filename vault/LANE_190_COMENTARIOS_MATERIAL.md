# Lane 190 — Q1b y A8: comentarios en el visor de material y borrador al agregar material

- **Comentarios de la familia** dentro del visor de material (`VisorMaterial`): «Comentarios de la familia» se abre bajo el contenido y carga la conversación recién entonces (`ComentariosEstudio`, destino `materialId`); sirve igual para el hijo (su material) y para los padres. Cierra el catálogo G1 en los tres lugares: lección, material y evidencia.
- **Borrador** al «Agregar material» (`AgregarMaterial` usa `useBorrador`, clave por destino): si se cierra el diálogo o se recarga la página, lo pegado vuelve; se borra al guardar. Catálogo A8 completo (con «Agregar varias», lane 170). La detección del enlace ya no corre con el diálogo cerrado.
