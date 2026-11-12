# Lane 97 — Premio obligatorio al registrar un comportamiento positivo

**Pedido (textual):**
> Que sea obligatorio llenar un premio para guardar el comportamiento

## Hecho
- Formulario (`ComportamientoAdmin`): con tipo Positivo, «Guardar» queda deshabilitado hasta agregar al menos un premio, con una nota que lo explica.
- Servidor (`registrarComportamiento`): un positivo sin premios se rechaza («Agregá al menos un premio…»), aunque se llame a la API a mano. Los negativos no cambian.
- Motivo: los registros de Ana sin premios no creaban nada para reclamar (ver lane 93).
