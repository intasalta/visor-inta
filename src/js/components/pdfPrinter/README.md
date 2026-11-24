# Módulo de Impresión y Exportación a PDF (PdfPrinter) - INTA Digital GEO

El componente `PdfPrinter` proporciona una solución cartográfica avanzada e interactiva para la impresión y exportación de mapas en formato PDF dentro del visor **INTA Digital GEO**.

## Características Principales

- **Modal interactivo con vista previa en tiempo real:** Muestra una simulación fiel de la hoja (A4 o A3) antes de exportar, actualizándose al instante ante cualquier modificación de títulos, orientación o capas.
- **Aprovechamiento total de página (Sin franjas blancas):** El mapa ocupa el 100% del área cartográfica disponible tanto en **Horizontal (Apaisado)** como **Vertical (Retrato)** mediante recorte centrado proporcional (`cropCanvasToRatio`), eliminando bordes vacíos o franjas de formato panorámico.
- **Soporte satelital y WMS sin teselas faltantes:** Detección de capas satelitales y sustitución segura con Esri World Imagery habilitado con CORS durante la captura, asegurando la carga del 100% de las teselas (`img.complete`) antes del renderizado.
- **Captura cartográfica limpia:** Oculta automáticamente los controles web de Leaflet (botones de zoom `+/-`, herramientas de dibujo, selector de capas) durante la exportación para lograr una presentación cartográfica profesional.
- **Diagramación equilibrada de referencias (Leyendas):** En orientación vertical organiza las capas activas en dos columnas automáticas balanceadas por altura; en horizontal se muestran en panel lateral compacto.
- **Personalización institucional:**
  - Título y subtítulo editables.
  - Inclusión opcional de logotipo oficial de INTA / IDGEO.
  - Fecha y hora de emisión.
  - Escala gráfica métrica calibrada y rosa de los vientos (símbolo de norte).
  - Marco cartográfico perimetral.
  - Opciones de descarga directa de PDF o envío a diálogo nativo de impresión.

## Dependencias

- **jsPDF** (`jspdf.umd.min.js`)
- **html2canvas** (`html2canvas.min.js`)
- **leaflet-image** (opcional como fallback)

## Uso

```javascript
// Instanciar y agregar botón de control a Leaflet
const pdfPrinter = new PdfPrinter();
pdfPrinter.createComponent();
```
