<div align="center">
  <img width="320" src="src/styles/images/intageo.png" alt="INTA Digital GEO" />
  <h1>INTA Digital GEO (ID GEO)</h1>
  <p><strong>Visor Geoespacial Oficial del Instituto Nacional de Tecnología Agropecuaria</strong></p>
  <p>
    <a href="https://github.com/intasalta/visor-inta" target="_blank">
      <img src="https://img.shields.io/badge/GitHub-intasalta%2Fvisor--inta-157DB9?style=flat&logo=github" alt="Repositorio GitHub" />
    </a>
    <img src="https://img.shields.io/badge/Plataforma-Argenmap%20v1.27.2-0284c7?style=flat" alt="Argenmap" />
    <img src="https://img.shields.io/badge/OGC-WMS%20%7C%20WFS%20%7C%20WCS-33b560?style=flat" alt="OGC" />
  </p>
</div>

---

## 🌐 Descripción General

**INTA Digital GEO (ID GEO)** es una plataforma geoespacial interactiva desarrollada sobre la base tecnológica de código abierto **Argenmap v1.27.2** (creada por el **Instituto Geográfico Nacional - IGN**), especialmente adaptada y extendida para centralizar, visualizar, consultar y analizar la producción de datos geográficos de los diferentes nodos y Estaciones Experimentales del **INTA** en toda la República Argentina.

El visor integra capas de recursos naturales, suelos, cobertura y uso del suelo, clima, biodiversidad, emergencias ambientales y ordenamiento territorial, consumiendo servicios interoperables **WMS**, **WFS** y **WCS** bajo estándares de la **Infraestructura de Datos Espaciales de la República Argentina (IDERA)** y del **Open Geospatial Consortium (OGC)**.

---

## 🚀 Nuevas Herramientas y Mejoras Incorporadas

### 1. 🔄 Capas Activas y Orden de Superposición (Drag & Drop)
* **Acceso**: Botón dedicado en la barra lateral izquierda (`fa-arrow-down-up-across-line`), ubicado inmediatamente después del menú de capas.
* **Badge contador en tiempo real**: Indicador numérico dinámico que muestra cuántas capas temáticas se encuentran encendidas en el mapa.
* **Reordenamiento por arrastrar y soltar (Drag & Drop)**: Permite reordenar visualmente las capas activas arrastrando los elementos con el mouse. El cambio de orden se aplica automáticamente tanto en el motor de renderizado de Leaflet (`setZIndex` y `bringToFront`) como en las peticiones WMS a GeoServer (`_subLayers` en `L.WMS.Source`).
* **Control de opacidad rápida**: Deslizador individual por capa (de 0% a 100%) para realizar comparaciones visuales y superposiciones.
* **Ocultamiento y eliminación**: Botón para ocultar temporalmente una capa sin perder su configuración y botón para desmarcarla/removerla directamente del mapa.
* **Leyendas y simbología cartográfica**: Extracción e inserción automática de gráficos de leyenda (`GetLegendGraphic`) con sistema de detección en cascada compatible con servidores GeoServer y GeoNode.
* **Fijación de panel (Pin)**: Posibilidad de mantener el panel abierto de forma flotante o acoplarlo con el comportamiento general del menú.

---

### 2. 🔍 Búsqueda Avanzada por Atributos y Consulta Alfanumérica
* **Acceso**: Botón en la botonera lateral izquierda (`fa-filter`).
* **Soporte multicapa**: Consulta capas vectoriales y servicios WFS/WMS (como Suelos, Desmontes, etc.) activos en el mapa.
* **Constructor de filtros lógicos**: Creación de múltiples condiciones combinadas mediante operadores `AND` (cumplir todas) u `OR` (cumplir alguna).
* **Búsqueda en "Todos los campos" (`__all__`)**: Permite ingresar términos (ej: `Haplumbreptes` o años como `2025`) sin necesidad de conocer de antemano el nombre exacto de la columna. El evaluador analiza dinámicamente los tipos de datos de GeoServer (`xsd:string`, `xsd:int`, `xsd:date`, etc.) para construir consultas CQL seguras sin provocar excepciones de casteo (`ClassCastException`).
* **Filtros espaciales integrados**:
  * 🌐 **Toda la capa**: Búsqueda global a nivel nacional o provincial.
  * 👁️ **Vista actual del mapa**: Restringe los resultados a la extensión visible en pantalla utilizando la cláusula espacial `BBOX(the_geom, ..., 'EPSG:4326')`.
  * 📐 **Dibujar recuadro**: Herramienta interactiva para trazar con el mouse un rectángulo geográfico específico sobre el mapa, con soporte de cancelación mediante la tecla `Escape`.
* **Visualización y descarga**:
  * Resaltado vectorial sobre el mapa con auto-zoom (`fitBounds`).
  * Visualización en tabla interactiva con paginación y búsqueda.
  * Descarga directa de los resultados filtrados en formato **GeoJSON** y **KML**.

---

### 3. 🎯 Localizador por Coordenadas (GMS y Decimales)
* **Acceso**: Barra superior de herramientas (`fa-location-crosshairs`).
* **Soporte de formatos**:
  * **Grados, Minutos y Segundos (GMS)** con selector de hemisferio (Norte/Sur, Este/Oeste).
  * **Grados Decimales (DD)** para latitud y longitud con validación numérica estricta.
* **Sincronización bidireccional**: Al escribir en un formato se calcula y completa automáticamente el otro en tiempo real.
* **Posicionamiento**: Colocación de marcador interactivo animado, centrado con auto-zoom y ficha emergente con botón de copia rápida al portapapeles.

---

### 4. 🔎 Zoom por Ventana (+ y -) (Box Zoom)
* **Acceso**: Barra superior de herramientas mediante dos botones independientes:
  * `fa-magnifying-glass-plus`: Zoom Ventana Acercar (+).
  * `fa-magnifying-glass-minus`: Zoom Ventana Alejar (-).
* **Interacción fluida**: Trazado de recuadro interactivo sobre el mapa con recuadro punteado (*marquee* visual) y cursor en cruz.
* **Cancelación**: Soporte para cancelar la operación en cualquier momento pulsando la tecla `Escape`.
* **Diseño estandarizado**: Dimensiones alineadas al estándar de Leaflet (`26px × 26px`) para garantizar uniformidad visual con el resto de botones de la barra.

---

### 5. 🖨️ Módulo de Impresión y Exportación Cartográfica a PDF
* **Acceso**: Barra superior de herramientas (`fa-print`).
* **Vista previa interactiva**: Panel modal con previsualización del mapa antes de generar el documento.
* **Personalización**: Título, subtítulo, selección de escala cartográfica, referencias automáticas y formatos estándar (A4, A3).
* **Orientación**: Modos Horizontal (*Landscape*) y Vertical (*Portrait*) calibrados para evitar franjas blancas o distorsiones de aspecto.

---

### 6. 📐 Optimización de la Barra de Herramientas
* **Ubicación de "Medir distancias y áreas"**: Se ubicó estratégicamente en el extremo izquierdo de la barra superior horizontal (`.leaflet-top.leaflet-left`). Al expandirse para realizar mediciones, el panel se despliega hacia el espacio abierto del mapa hacia la izquierda, **sin empujar ni desalinear el resto de las herramientas**.
* **Secuencia ordenada y estable**:
  1. 📐 **Medir distancias y áreas** (`.leaflet-control-measure`)
  2. 🎯 **Localizar por coordenadas** (`#coordinateLocator`)
  3. 🔍 **Zoom Ventana +** (`#boxZoomIn`)
  4. 🔎 **Zoom Ventana -** (`#boxZoomOut`)
  5. 🌐 **Cuadrícula** (`.leaflet-control-customgraticule`)
  6. ⛶ **Pantalla completa** (`#fullscreen`)
  7. 📷 **Captura de pantalla** (`#screenShoter`)
  8. 🖨️ **Imprimir a PDF** (`#pdfPrinter`)
  9. 🖱️ **Consultar datos** (`#consultData`)
* **Observador DOM (`MutationObserver`)**: Mantiene el orden de los controles de manera indestructible ante cargas asincrónicas de plugins.

---

### 7. 📱 Adaptabilidad Responsive y Persistencia de Controles Inferiores
* **Corrección de comportamiento con zoom del navegador**: Se eliminó la regla CSS restrictiva (`@media (max-height: 600px)`) que ocultaba los controles inferiores.
* **Visibilidad garantizada**: Tanto el acceso a **"Acerca de ID GEO"** (esquina inferior izquierda) como los botones de control de zoom y escala (esquina inferior derecha) se mantienen plenamente visibles y operativos incluso al aplicar niveles altos de zoom en el navegador (120%, 150%, 175%).

---

### 8. 🏛️ Identidad Institucional y Acerca de ID GEO
* **Branding institucional**: Incorporación del logotipo oficial de **INTA Digital GEO** en el encabezado y ventanas modales.
* **Ventana "Acerca de ID GEO"**: Panel informativo que detalla el propósito de la plataforma, el marco tecnológico Argenmap / IGN y el listado de funcionalidades implementadas.
* **Repositorio oficial**: Enlace directo y actualizado al repositorio de código fuente en GitHub:
  🔗 [https://github.com/intasalta/visor-inta](https://github.com/intasalta/visor-inta)

---

## 📂 Estructura de Componentes Principales

```text
anti_geointa/
├── index.html
├── src/
│   ├── config/
│   │   ├── data.json                   # Árbol jerárquico de capas temáticas y WMS
│   │   └── preferences.json            # Configuración general, logos y parámetros
│   ├── css/ / src/styles/css/
│   │   └── main.css                    # Estilos globales y reglas responsive
│   └── js/
│       ├── app.js                      # Inicialización central de la aplicación
│       ├── entities.js                 # Gestor de capas y modelo de datos
│       ├── map/
│       │   └── map.js                  # Lógica del mapa Leaflet y plugins OGC
│       └── components/
│           ├── activeLayersOrder/      # Panel de capas activas y superposición
│           ├── attributeSearch/        # Búsqueda por atributos alfanuméricos y espacial
│           ├── coordinateLocator/      # Localizador por coordenadas GMS y Decimal
│           ├── boxZoom/                # Herramienta de Zoom Ventana (+ y -)
│           ├── pdfPrinter/             # Módulo de exportación e impresión PDF
│           ├── toolbar/                # Gestión y ordenamiento de la barra superior
│           └── about/                  # Ventana institucional "Acerca de ID GEO"
```

---

## 🛠️ Tecnologías Utilizadas

* **Motor de mapas**: [Leaflet 1.6.0](https://leafletjs.com/)
* **Plataforma base**: [Argenmap v1.27.2](https://github.com/ign-argentina/argenmap) (Instituto Geográfico Nacional)
* **Framework y diseño**: Bootstrap 3.3, jQuery 3.7.0, FontAwesome 6, Boxicons
* **Análisis geoespacial en cliente**: Turf.js
* **Servicios de backend**: GeoServer / PostGIS (OGC WMS, WFS, WCS)
* **Exportación de documentos**: jsPDF, html2canvas

---

## 📄 Licencia y Créditos

Este desarrollo es una iniciativa del **Instituto Nacional de Tecnología Agropecuaria (INTA)**, basada en el desarrollo libre y colaborativo de **Argenmap** del **Instituto Geográfico Nacional (IGN)**. Distribuido bajo licencia de código abierto para organismos públicos e instituciones científicas.
