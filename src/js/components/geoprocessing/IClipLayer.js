"use strict";

// Catálogo precargado de coberturas ráster conocidas de GeoINTA (WCS)
const INTA_RASTER_COVERAGES = new Set([
  "geonode:mapa_cos_nacional",
  "geonode:mnc_invierno_2019",
  "geonode:invierno2020",
  "geonode:mnc_invierno2021",
  "geonode:mnc_invierno2022",
  "geonode:mnc_invierno2023_d86dd2aa0b678a011b89830f77cec883",
  "geonode:mnc_2018_2019_v1r1",
  "geonode:mnc_verano_2020",
  "geonode:mnc_verano2021",
  "geonode:mnc_verano2022",
  "geonode:mnc_verano_2023",
  "geonode:mnc_verano2024_f300268fd112b0ec3ef5f731edb78882",
  "geonode:region_9b_playasmarismascostapatagonica_comba79eaa95809c",
  "geonode:region_5b_riachosesteroschacohumedo_v269ee49d4ac65",
  "geonode:a__01_ep", "geonode:a__01_p_ep", "geonode:a__01_pp",
  "geonode:a__02_ep", "geonode:a__02_p_ep", "geonode:a__02_pp",
  "geonode:a__03_ep", "geonode:a__03_p_ep", "geonode:a__03_pp",
  "geonode:a__04_ep", "geonode:a__04_p_ep",
  "geonode:a__05_ep", "geonode:a__05_p_ep",
  "geonode:a__06_ep", "geonode:a__06_p_ep",
  "geonode:a__07_ep", "geonode:a__07_p_ep",
  "geonode:a__08_ep", "geonode:a__08_p_ep",
  "geonode:a__09_ep", "geonode:a__09_p_ep",
  "geonode:a__10_ep", "geonode:a__10_p_ep",
  "geonode:a__11_ep", "geonode:a__11_p_ep",
  "geonode:a__12_ep", "geonode:a__12_p_ep",
  "geonode:erosion_actual_pilcomayo",
  "geonode:erosion_bermejo_inferior_actual",
  "geonode:erosion_bermejo_superior_actual",
  "geonode:erosion_bermejo_superior_potencial",
  "geonode:erosion_juramento_actual",
  "geonode:erosion_potencial_bermejo_inferior",
  "geonode:erosion_potencial_juramento",
  "geonode:erosion_potencial_pilcomayo",
  "geonode:geonode__04pp",
  "geonode:geonode__05_pp_clip",
  "geonode:geonode__06_pp",
  "geonode:geonode__07_pp",
  "geonode:geonode__08_pp",
  "geonode:geonode__09_pp",
  "geonode:geonode__10_pp",
  "geonode:geonode__11_pp",
  "geonode:geonode__12_pp",
  "geonode:geonode_pp_def",
  "geonode:indice_aridez_demartone",
  "geonode:p_ep_balanceh",
  "geonode:precipitacion_anual",
  "geonode:saltajujuy_ip_clima",
  "geonode:saltajujuy_ip_edafico",
  "geonode:saltajujuy_ip_final",
  "geonode:saltajujuy_ip_topografia"
]);

// Carga en segundo plano de capacidades WCS de los servidores INTA para capas adicionales
if (typeof window !== "undefined" && !window._intaWcsCoverages) {
  window._intaWcsCoverages = new Set();
  const wcsServers = [
    "https://geo-backend.inta.gob.ar/geoserver/wcs?service=WCS&version=1.0.0&request=GetCapabilities",
    "https://geo-nodo01.inta.gob.ar/geoserver/wcs?service=WCS&version=1.0.0&request=GetCapabilities",
    "https://geo-nodo05.inta.gob.ar/geoserver/wcs?service=WCS&version=1.0.0&request=GetCapabilities"
  ];
  wcsServers.forEach((serverUrl) => {
    try {
      fetch(serverUrl)
        .then((r) => r.text())
        .then((xml) => {
          const regex = /<wcs:name>([^<]+)<\/wcs:name>/g;
          let m;
          while ((m = regex.exec(xml)) !== null) {
            const val = m[1].trim().toLowerCase();
            if (val && val !== "my geoserver wcs") {
              window._intaWcsCoverages.add(val);
              if (val.includes(":")) {
                const raw = val.split(":")[1];
                window._intaWcsCoverages.add(raw);
                window._intaWcsCoverages.add(raw.replace(/_[a-f0-9]{20,}$/i, ""));
              }
            }
          }
        })
        .catch(() => {});
    } catch (e) {}
  });
}

class IClipLayer {
  constructor() {
    this.name = "Recortar capa";
    this.namePrefix = "recorte_";
    this.selectedLayerName = null;
    this.selectedFormat = "geojson";
    this.isDrawing = false;
  }

  getFields() {
    return [
      {
        name: "Capa",
        title: "Capa a recortar",
        element: "select",
        id: "select-capa",
        references: "drawedLayers",
        allowedTypes: ["polygon", "rectangle"],
      },
      {
        name: "Formato",
        title: "Formato de descarga",
        element: "select",
        id: "select-formato",
        options: [
          { value: "geojson", text: "GeoJSON (.geojson) [Vectorial]" },
          { value: "kml", text: "KML (.kml) [Vectorial]" },
          { value: "shp", text: "Shapefile (.zip / GeoJSON) [Vectorial]" },
        ],
      },
      {
        name: "Dibujar Polígono",
        element: "button",
        id: "drawPolygonBtn",
        onclick: () => this.drawPolygon(),
      },
      {
        name: "Dibujar Rectángulo",
        element: "button",
        id: "drawRectangleBtn",
        onclick: () => this.drawRectangle(),
      },
    ];
  }

  onLayerSelectionChange(layerName) {
    const formatSelect = document.getElementById("select-formato") || document.getElementById("select-formatodedescarga");
    if (!formatSelect) return;

    if (!layerName) {
      formatSelect.innerHTML = "<option value=''>Seleccione una capa</option>";
      return;
    }

    const isVector = this.isVectorLayer(layerName);
    formatSelect.innerHTML = "";

    if (!isVector) {
      // Opciones para capas ráster
      const optZip = document.createElement("option");
      optZip.value = "geotiff_sld_zip";
      optZip.text = "GeoTIFF + Estilo SLD (.zip) [Ráster]";
      optZip.selected = true;
      formatSelect.appendChild(optZip);

      const optTif = document.createElement("option");
      optTif.value = "geotiff";
      optTif.text = "GeoTIFF (.tif) solo [Ráster]";
      formatSelect.appendChild(optTif);

      this.selectedFormat = "geotiff_sld_zip";
    } else {
      // Opciones para capas vectoriales
      const optGeojson = document.createElement("option");
      optGeojson.value = "geojson";
      optGeojson.text = "GeoJSON (.geojson) [Vectorial]";
      optGeojson.selected = true;
      formatSelect.appendChild(optGeojson);

      const optKml = document.createElement("option");
      optKml.value = "kml";
      optKml.text = "KML (.kml) [Vectorial]";
      formatSelect.appendChild(optKml);

      const optShp = document.createElement("option");
      optShp.value = "shp";
      optShp.text = "Shapefile (.zip / GeoJSON) [Vectorial]";
      formatSelect.appendChild(optShp);

      this.selectedFormat = "geojson";
    }

    formatSelect.value = this.selectedFormat;
  }

  async ensureJSZip() {
    if (typeof JSZip !== "undefined") return window.JSZip;
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js";
      script.onload = () => resolve(window.JSZip || null);
      script.onerror = () => {
        console.warn("No se pudo cargar JSZip desde CDN.");
        resolve(null);
      };
      document.head.appendChild(script);
    });
  }

  drawPolygon() {
    if (typeof L === "undefined" || !L.Draw || !L.Draw.Polygon) {
      new UserMessage("Herramienta de dibujo no disponible.", true, "error");
      return;
    }
    this.clearPreviousSelection();
    const drawPolygon = new L.Draw.Polygon(mapa, {
      shapeOptions: {
        color: "#008dc9",
        fillColor: "#008dc9",
        fillOpacity: 0.25,
        weight: 3,
      },
    });
    this.currentDrawHandler = drawPolygon;
    isSelectionDrawingActive = true;
    $("#drawPolygonBtn").addClass("ag-btn-disabled");
    $("#drawRectangleBtn").addClass("ag-btn-disabled");

    $("#msgClipStatus")
      .html(
        "Haga clic en el mapa para trazar los vértices. Cierre haciendo clic en el <b>primer punto</b> o <b>doble clic</b>." +
        " <button id='btnFinishPolygon' type='button' class='btn btn-xs btn-primary' style='margin-left:8px;padding:2px 8px;font-size:11px;'>Cerrar forma</button>" +
        " <button id='btnCancelClipDraw' type='button' class='btn btn-xs btn-default' style='margin-left:4px;padding:2px 8px;font-size:11px;'>Cancelar</button>"
      )
      .removeClass("hidden")
      .css("color", "#333");

    $("#btnFinishPolygon").off("click").on("click", (e) => {
      e.preventDefault();
      if (this.currentDrawHandler && typeof this.currentDrawHandler.completeShape === "function") {
        this.currentDrawHandler.completeShape();
      }
    });

    $("#btnCancelClipDraw").off("click").on("click", (e) => {
      e.preventDefault();
      this.cancelDrawing();
    });

    const onMapDblClick = (e) => {
      if (this.currentDrawHandler && typeof this.currentDrawHandler.completeShape === "function") {
        if (this.currentDrawHandler._markers && this.currentDrawHandler._markers.length >= 3) {
          if (e && e.originalEvent) {
            L.DomEvent.stopPropagation(e.originalEvent);
          }
          this.currentDrawHandler.completeShape();
        }
      }
    };
    mapa.on("dblclick", onMapDblClick);

    const onDrawFinished = () => {
      mapa.off("dblclick", onMapDblClick);
      mapa.off("draw:created", onDrawFinished);
      mapa.off("draw:drawstop", onDrawFinished);
      isSelectionDrawingActive = false;
      $("#drawPolygonBtn").removeClass("ag-btn-disabled");
      $("#drawRectangleBtn").removeClass("ag-btn-disabled");
      this.currentDrawHandler = null;
    };

    mapa.once("draw:created", onDrawFinished);
    mapa.once("draw:drawstop", onDrawFinished);

    drawPolygon.enable();
  }

  drawRectangle() {
    if (typeof L === "undefined" || !L.Draw || !L.Draw.Rectangle) {
      new UserMessage("Herramienta de dibujo no disponible.", true, "error");
      return;
    }
    this.clearPreviousSelection();
    const drawRectangle = new L.Draw.Rectangle(mapa, {
      shapeOptions: {
        color: "#008dc9",
        fillColor: "#008dc9",
        fillOpacity: 0.25,
        weight: 3,
      },
    });
    this.currentDrawHandler = drawRectangle;
    isSelectionDrawingActive = true;
    $("#drawPolygonBtn").addClass("ag-btn-disabled");
    $("#drawRectangleBtn").addClass("ag-btn-disabled");

    $("#msgClipStatus")
      .html(
        "Haga clic y arrastre en el mapa para trazar el rectángulo." +
        " <button id='btnCancelClipDraw' type='button' class='btn btn-xs btn-default' style='margin-left:8px;padding:2px 8px;font-size:11px;'>Cancelar</button>"
      )
      .removeClass("hidden")
      .css("color", "#333");

    $("#btnCancelClipDraw").off("click").on("click", (e) => {
      e.preventDefault();
      this.cancelDrawing();
    });

    const onDrawFinished = () => {
      mapa.off("draw:created", onDrawFinished);
      mapa.off("draw:drawstop", onDrawFinished);
      isSelectionDrawingActive = false;
      $("#drawPolygonBtn").removeClass("ag-btn-disabled");
      $("#drawRectangleBtn").removeClass("ag-btn-disabled");
      this.currentDrawHandler = null;
    };

    mapa.once("draw:created", onDrawFinished);
    mapa.once("draw:drawstop", onDrawFinished);

    drawRectangle.enable();
  }

  cancelDrawing() {
    if (this.currentDrawHandler && typeof this.currentDrawHandler.disable === "function") {
      try {
        this.currentDrawHandler.disable();
      } catch (e) {}
    }
    this.currentDrawHandler = null;
    isSelectionDrawingActive = false;
    $("#drawPolygonBtn").removeClass("ag-btn-disabled");
    $("#drawRectangleBtn").removeClass("ag-btn-disabled");
    $("#msgClipStatus")
      .html("Dibujo cancelado. Puede volver a dibujar o seleccionar otra herramienta.")
      .removeClass("hidden")
      .css("color", "#777");
  }

  clearPreviousSelection() {
    if (this.currentDrawHandler && typeof this.currentDrawHandler.disable === "function") {
      try {
        this.currentDrawHandler.disable();
      } catch (e) {}
    }
    this.currentDrawHandler = null;
    isSelectionDrawingActive = false;
    $("#drawPolygonBtn").removeClass("ag-btn-disabled");
    $("#drawRectangleBtn").removeClass("ag-btn-disabled");

    if (typeof drawnItems !== "undefined" && drawnItems && drawnItems._layers) {
      Object.values(drawnItems._layers).forEach((lyr) => {
        if (
          lyr &&
          ((lyr.id && String(lyr.id).includes("selection_")) ||
            (lyr.name && String(lyr.name).includes("selection_")) ||
            (lyr.options && lyr.options.fillColor === "#008dc9" && lyr.options.color === "#008dc9"))
        ) {
          drawnItems.removeLayer(lyr);
        }
      });
    }

    if (mapa && mapa.editableLayers) {
      ["polygon", "rectangle"].forEach((type) => {
        if (mapa.editableLayers[type]) {
          for (let i = mapa.editableLayers[type].length - 1; i >= 0; i--) {
            const lyr = mapa.editableLayers[type][i];
            if (
              lyr &&
              ((lyr.id && String(lyr.id).includes("selection_")) ||
                (lyr.name && String(lyr.name).includes("selection_")) ||
                (lyr.options && lyr.options.fillColor === "#008dc9" && lyr.options.color === "#008dc9"))
            ) {
              if (typeof drawnItems !== "undefined" && drawnItems && drawnItems.hasLayer(lyr)) {
                drawnItems.removeLayer(lyr);
              }
              mapa.editableLayers[type].splice(i, 1);
            }
          }
        }
      });
    }
  }

  cleanupDrawnShape(drawnShape) {
    if (this.currentDrawHandler && typeof this.currentDrawHandler.disable === "function") {
      try {
        this.currentDrawHandler.disable();
      } catch (e) {}
    }
    this.currentDrawHandler = null;
    isSelectionDrawingActive = false;

    if (drawnShape) {
      if (typeof drawnItems !== "undefined" && drawnItems && drawnItems.hasLayer(drawnShape)) {
        drawnItems.removeLayer(drawnShape);
      }
      if (typeof mapa !== "undefined" && mapa && mapa.hasLayer(drawnShape)) {
        mapa.removeLayer(drawnShape);
      }
      if (typeof mapa !== "undefined" && mapa && typeof mapa.deleteLayer === "function") {
        try {
          if (drawnShape.name) mapa.deleteLayer(drawnShape.name);
          if (drawnShape.id) mapa.deleteLayer(drawnShape.id);
        } catch (e) {}
      }
    }
    this.clearPreviousSelection();
  }

  getDrawnShape() {
    let drawn = null;
    if (mapa && mapa.editableLayers) {
      if (mapa.editableLayers.polygon && mapa.editableLayers.polygon.length > 0) {
        drawn = mapa.editableLayers.polygon.find(
          (lyr) => lyr && lyr.id && String(lyr.id).includes("selection_"),
        );
        if (!drawn) {
          drawn = mapa.editableLayers.polygon[mapa.editableLayers.polygon.length - 1];
        }
      }
      if (!drawn && mapa.editableLayers.rectangle && mapa.editableLayers.rectangle.length > 0) {
        drawn = mapa.editableLayers.rectangle.find(
          (lyr) => lyr && lyr.id && String(lyr.id).includes("selection_"),
        );
        if (!drawn) {
          drawn = mapa.editableLayers.rectangle[mapa.editableLayers.rectangle.length - 1];
        }
      }
    }
    return drawn;
  }

  getPolygonWkt(drawnShape) {
    if (!drawnShape) return null;
    let latlngs = null;
    if (typeof drawnShape.getLatLngs === "function") {
      latlngs = drawnShape.getLatLngs();
      while (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
        latlngs = latlngs[0];
      }
    } else if (drawnShape._latlngs) {
      latlngs = drawnShape._latlngs;
      while (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
        latlngs = latlngs[0];
      }
    }

    if (!latlngs || latlngs.length < 3) return null;

    const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push(first);
    }

    const wktPairs = coords.map((c) => `${c[0]} ${c[1]}`).join(", ");
    return `POLYGON((${wktPairs}))`;
  }

  getClipPolygonTurf(drawnShape) {
    if (!drawnShape) return null;
    try {
      if (typeof drawnShape.toGeoJSON === "function") {
        const gj = drawnShape.toGeoJSON();
        if (gj && gj.geometry && gj.geometry.type === "Polygon") {
          return turf.polygon(gj.geometry.coordinates);
        }
      }
    } catch (e) {}

    let latlngs = null;
    if (typeof drawnShape.getLatLngs === "function") {
      latlngs = drawnShape.getLatLngs();
    } else if (drawnShape._latlngs) {
      latlngs = drawnShape._latlngs;
    }
    while (Array.isArray(latlngs) && latlngs.length > 0 && Array.isArray(latlngs[0])) {
      latlngs = latlngs[0];
    }
    if (!latlngs || latlngs.length < 3) return null;

    const coords = latlngs.map((ll) => [ll.lng, ll.lat]);
    const first = coords[0];
    const last = coords[coords.length - 1];
    if (first[0] !== last[0] || first[1] !== last[1]) {
      coords.push(first);
    }
    return turf.polygon([coords]);
  }

  clipFeatureCollection(sourceGeoJSON, clipPoly) {
    if (!sourceGeoJSON || !sourceGeoJSON.features || typeof turf === "undefined") {
      return sourceGeoJSON;
    }

    const clippedFeatures = [];
    let boundary = null;
    try {
      boundary = turf.polygonToLine(clipPoly);
    } catch (e) {}

    turf.featureEach(sourceGeoJSON, (feature) => {
      if (!feature || !feature.geometry) return;
      const geomType = feature.geometry.type;

      if (geomType === "Polygon" || geomType === "MultiPolygon") {
        try {
          const clipped = turf.intersect(feature, clipPoly);
          if (
            clipped &&
            clipped.geometry &&
            clipped.geometry.coordinates &&
            clipped.geometry.coordinates.length > 0
          ) {
            clipped.properties = Object.assign({}, feature.properties);
            clippedFeatures.push(clipped);
          }
        } catch (err) {
          console.warn("Error recortando polígono:", err);
        }
      } else if (geomType === "Point") {
        try {
          if (turf.booleanPointInPolygon(feature, clipPoly)) {
            clippedFeatures.push(JSON.parse(JSON.stringify(feature)));
          }
        } catch (err) {}
      } else if (geomType === "MultiPoint") {
        try {
          const inside = feature.geometry.coordinates.filter((coord) => {
            return turf.booleanPointInPolygon(turf.point(coord), clipPoly);
          });
          if (inside.length > 0) {
            clippedFeatures.push({
              type: "Feature",
              properties: Object.assign({}, feature.properties),
              geometry: {
                type: "MultiPoint",
                coordinates: inside,
              },
            });
          }
        } catch (err) {}
      } else if (geomType === "LineString") {
        try {
          if (turf.booleanWithin(feature, clipPoly)) {
            clippedFeatures.push(JSON.parse(JSON.stringify(feature)));
          } else if (boundary && turf.booleanIntersects(feature, clipPoly)) {
            const split = turf.lineSplit(feature, boundary);
            if (split && split.features && split.features.length > 0) {
              split.features.forEach((segment) => {
                const c = segment.geometry.coordinates;
                if (c.length >= 2) {
                  const mid = turf.midpoint(
                    turf.point(c[0]),
                    turf.point(c[c.length - 1]),
                  );
                  if (turf.booleanPointInPolygon(mid, clipPoly)) {
                    segment.properties = Object.assign({}, feature.properties);
                    clippedFeatures.push(segment);
                  }
                }
              });
            }
          }
        } catch (err) {
          console.warn("Error recortando línea:", err);
        }
      } else if (geomType === "MultiLineString") {
        try {
          feature.geometry.coordinates.forEach((lineCoords) => {
            const singleLine = turf.lineString(lineCoords, feature.properties);
            if (turf.booleanWithin(singleLine, clipPoly)) {
              clippedFeatures.push(singleLine);
            } else if (boundary && turf.booleanIntersects(singleLine, clipPoly)) {
              const split = turf.lineSplit(singleLine, boundary);
              if (split && split.features && split.features.length > 0) {
                split.features.forEach((segment) => {
                  const c = segment.geometry.coordinates;
                  if (c.length >= 2) {
                    const mid = turf.midpoint(
                      turf.point(c[0]),
                      turf.point(c[c.length - 1]),
                    );
                    if (turf.booleanPointInPolygon(mid, clipPoly)) {
                      segment.properties = Object.assign({}, feature.properties);
                      clippedFeatures.push(segment);
                    }
                  }
                });
              }
            }
          });
        } catch (err) {
          console.warn("Error recortando multilínea:", err);
        }
      }
    });

    return turf.featureCollection(clippedFeatures);
  }

  geojsonToKml(geojson, docName = "Recorte") {
    const coordsToKml = (coords) => {
      return coords.map((c) => `${c[0]},${c[1]},${c[2] || 0}`).join(" ");
    };

    const geomToKml = (geom) => {
      if (!geom) return "";
      switch (geom.type) {
        case "Point":
          return `<Point><coordinates>${coordsToKml([geom.coordinates])}</coordinates></Point>`;
        case "MultiPoint":
          return `<MultiGeometry>${geom.coordinates
            .map((c) => `<Point><coordinates>${coordsToKml([c])}</coordinates></Point>`)
            .join("")}</MultiGeometry>`;
        case "LineString":
          return `<LineString><coordinates>${coordsToKml(geom.coordinates)}</coordinates></LineString>`;
        case "MultiLineString":
          return `<MultiGeometry>${geom.coordinates
            .map((c) => `<LineString><coordinates>${coordsToKml(c)}</coordinates></LineString>`)
            .join("")}</MultiGeometry>`;
        case "Polygon":
          return `<Polygon>${geom.coordinates
            .map((ring, idx) => {
              const tag = idx === 0 ? "outerBoundaryIs" : "innerBoundaryIs";
              return `<${tag}><LinearRing><coordinates>${coordsToKml(ring)}</coordinates></LinearRing></${tag}>`;
            })
            .join("")}</Polygon>`;
        case "MultiPolygon":
          return `<MultiGeometry>${geom.coordinates
            .map((poly) => {
              return `<Polygon>${poly
                .map((ring, idx) => {
                  const tag = idx === 0 ? "outerBoundaryIs" : "innerBoundaryIs";
                  return `<${tag}><LinearRing><coordinates>${coordsToKml(ring)}</coordinates></LinearRing></${tag}>`;
                })
                .join("")}</Polygon>`;
            })
            .join("")}</MultiGeometry>`;
        default:
          return "";
      }
    };

    let placemarks = "";
    const features = geojson.features || (geojson.type === "Feature" ? [geojson] : []);
    features.forEach((feat, i) => {
      const name =
        (feat.properties &&
          (feat.properties.nombre ||
            feat.properties.name ||
            feat.properties.title ||
            feat.properties.id)) ||
        `Elemento ${i + 1}`;
      let desc = "";
      let extData = "";
      if (feat.properties) {
        const rows = Object.entries(feat.properties)
          .map(([k, v]) => `<b>${k}:</b> ${v}`)
          .join("<br/>");
        desc = `<description><![CDATA[${rows}]]></description>`;

        const dataEntries = Object.entries(feat.properties)
          .filter(([k]) => k !== "bbox" && k !== "styles")
          .map(([k, v]) => {
            const cleanVal =
              v !== undefined && v !== null
                ? String(v)
                    .replace(/&/g, "&amp;")
                    .replace(/</g, "&lt;")
                    .replace(/>/g, "&gt;")
                : "";
            return `      <Data name="${k}"><value>${cleanVal}</value></Data>`;
          })
          .join("\n");
        if (dataEntries) {
          extData = `    <ExtendedData>\n${dataEntries}\n    </ExtendedData>\n`;
        }
      }
      placemarks += `    <Placemark>
      <name>${name}</name>
      ${desc}
${extData}      ${geomToKml(feat.geometry)}
    </Placemark>\n`;
    });

    return `<?xml version="1.0" encoding="UTF-8"?>
<kml xmlns="http://www.opengis.net/kml/2.2">
<Document>
  <name>${docName}</name>
${placemarks}</Document>
</kml>`;
  }

  getWfsUrl(wmsHost) {
    if (!wmsHost) return "";
    let url = wmsHost.trim().split("?")[0];
    if (/\/wms\/?$/i.test(url)) {
      return url.replace(/\/wms\/?$/i, "/wfs");
    } else if (/\/ows\/?$/i.test(url)) {
      return url.replace(/\/ows\/?$/i, "/wfs");
    } else if (url.includes("/geoserver/")) {
      return url.replace(/\/geoserver\/.*$/i, "/geoserver/wfs");
    } else {
      return url.replace(/wms/gi, "wfs");
    }
  }

  async detectGeometryColumn(wfsUrl, typeName) {
    // 1. Probar DescribeFeatureType con formato JSON
    try {
      const urlJson = `${wfsUrl}?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${encodeURIComponent(typeName)}&outputFormat=application/json`;
      const resJson = await fetch(urlJson);
      if (resJson.ok) {
        const ct = resJson.headers.get("content-type") || "";
        if (ct.includes("json")) {
          const data = await resJson.json();
          if (data && data.featureTypes && data.featureTypes[0] && data.featureTypes[0].properties) {
            for (const prop of data.featureTypes[0].properties) {
              const type = (prop.type || prop.localType || "").toLowerCase();
              if (
                type.includes("geom") ||
                type.includes("polygon") ||
                type.includes("surface") ||
                type.includes("line") ||
                type.includes("point") ||
                type.includes("curve")
              ) {
                return prop.name;
              }
            }
          }
        }
      }
    } catch (err) {
      console.warn("No se pudo obtener DescribeFeatureType en JSON, probando XML...", err);
    }

    // 2. Probar DescribeFeatureType en formato estándar XML
    try {
      const urlXml = `${wfsUrl}?service=WFS&version=1.1.0&request=DescribeFeatureType&typeName=${encodeURIComponent(typeName)}`;
      const resXml = await fetch(urlXml);
      if (resXml.ok) {
        const text = await resXml.text();
        if (text.includes("ExceptionReport") || text.includes("ServiceException")) {
          throw new Error("La capa seleccionada no admite servicio WFS o no es una capa vectorial.");
        }
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        const elements = xmlDoc.querySelectorAll("element");
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          const type = (el.getAttribute("type") || "").toLowerCase();
          if (
            type.startsWith("gml:") ||
            type.includes("geometry") ||
            type.includes("polygon") ||
            type.includes("surface") ||
            type.includes("line") ||
            type.includes("point")
          ) {
            return el.getAttribute("name");
          }
        }
      }
    } catch (err) {
      if (err.message && err.message.includes("no admite")) throw err;
      console.warn("No se pudo parsear DescribeFeatureType XML, usando campo por defecto 'the_geom'.", err);
    }

    return "the_geom";
  }

  static isRasterName(layerName) {
    if (!layerName) return false;
    const nameLower = String(layerName).toLowerCase().trim();
    const rawName = nameLower.includes(":") ? nameLower.split(":")[1] : nameLower;
    const baseName = rawName.replace(/_[a-f0-9]{20,}$/i, "");
    const prefixedName = `geonode:${rawName}`;
    const prefixedBase = `geonode:${baseName}`;

    // 1. Capas subidas localmente por el usuario vectoriales o ráster
    if (typeof addedLayers !== "undefined" && Array.isArray(addedLayers)) {
      const added = addedLayers.find((l) => l && (l.name === layerName || l.id === layerName));
      if (added && (added.type === "geotiff" || added.type === "tif" || added.type === "tiff")) {
        return true;
      }
      if (added && (added.type === "geojson" || added.type === "shp" || added.type === "kml" || added.type === "geoprocess")) {
        return false;
      }
    }

    // 2. Coberturas WCS dinámicas obtenidas del servidor GeoServer INTA
    if (typeof window !== "undefined" && window._intaWcsCoverages) {
      if (
        window._intaWcsCoverages.has(nameLower) ||
        window._intaWcsCoverages.has(rawName) ||
        window._intaWcsCoverages.has(baseName) ||
        window._intaWcsCoverages.has(prefixedName) ||
        window._intaWcsCoverages.has(prefixedBase)
      ) {
        return true;
      }
    }

    // 3. Catálogo base precargado de coberturas ráster WCS de INTA
    if (
      INTA_RASTER_COVERAGES.has(nameLower) ||
      INTA_RASTER_COVERAGES.has(rawName) ||
      INTA_RASTER_COVERAGES.has(baseName) ||
      INTA_RASTER_COVERAGES.has(prefixedName) ||
      INTA_RASTER_COVERAGES.has(prefixedBase)
    ) {
      return true;
    }

    // 4. Patrones de nomenclatura de coberturas ráster en GeoServer INTA y GeoNode
    // Coincide con capas como: 01_p_ep_..., 01_pp_..., 01_tempera_..., texclass, mnc, balanceh, aridez, etc.
    const rasterPatterns = [
      /(^|:|_)(0[1-9]|1[0-2])_p_ep(_|$)/i,
      /(^|:|_)(0[1-9]|1[0-2])_pp(_|$)/i,
      /(^|:|_)(0[1-9]|1[0-3])_tempera(_|$)/i,
      /(^|:|_)(04pp|05_pp_clip|precipitacion_anual|p_ep_balanceh|balanceh|indice_aridez|indice_aridez_demartone)(_|$)/i,
      /(^|:|_)(mnc_|texclass_|lccs_|ire_|nro_cultivos_|numero_cereales_|numero_s1_|rotaciones_)/i,
      /(^|:|_)(a__\d\d_|geonode__\d\d_|erosion_|mapa_cos_|saltajujuy_ip_|deficit|temperatura|evapotranspiracion|dem_|mde_|srtm_|alos_)/i
    ];
    for (const pat of rasterPatterns) {
      if (pat.test(nameLower) || pat.test(rawName) || pat.test(baseName)) {
        return true;
      }
    }

    // 5. Metadatos de la sección o capa en gestorMenu
    if (typeof gestorMenu !== "undefined") {
      try {
        if (gestorMenu.items) {
          for (const secKey in gestorMenu.items) {
            const sec = gestorMenu.items[secKey];
            if (!sec) continue;
            const secId = String(sec.seccion || "").toLowerCase();
            const secNom = String(sec.nombre || "").toLowerCase();
            const isRasterSection = secId === "clima" || secId === "mde" || secNom.includes("clima") || secNom.includes("elevaci");

            if (sec.itemsComposite) {
              for (const itKey in sec.itemsComposite) {
                const it = sec.itemsComposite[itKey];
                if (it && (it.nombre === layerName || (it.capa && it.capa.nombre === layerName))) {
                  if (isRasterSection) return true;
                  if (it.capa && (it.capa.tipo === "raster" || it.capa.servicio === "wcs")) return true;
                  if (it.capa && (it.capa.tipo === "vector" || it.capa.servicio === "wfs")) return false;
                }
              }
            }
          }
        }
      } catch (e) {}

      if (typeof gestorMenu.getLayerData === "function") {
        try {
          const data = gestorMenu.getLayerData(layerName);
          if (data && data.capa) {
            if (data.capa.tipo === "raster" || data.capa.servicio === "wcs") return true;
            if (data.capa.tipo === "vector" || data.capa.servicio === "wfs") return false;
          }
        } catch (e) {}
      }
    }

    return false;
  }

  isRasterLayer(layerName) {
    return IClipLayer.isRasterName(layerName);
  }

  isVectorLayer(layerName) {
    return !this.isRasterLayer(layerName);
  }

  findLayerInfo(layerName) {
    // 1. gestorMenu.getActiveLayersWithoutBasemap()
    if (typeof gestorMenu !== "undefined") {
      if (typeof gestorMenu.getActiveLayersWithoutBasemap === "function") {
        try {
          const activeWithoutBase = gestorMenu.getActiveLayersWithoutBasemap();
          const found = activeWithoutBase.find((l) => l.name === layerName);
          if (found && (found.host || (found.capa && found.capa.host))) {
            return {
              name: layerName,
              title: found.title || layerName,
              host: found.host || found.capa.host,
            };
          }
        } catch (e) {}
      }

      // 2. gestorMenu.getLayerData()
      if (typeof gestorMenu.getLayerData === "function") {
        try {
          const lData = gestorMenu.getLayerData(layerName);
          if (lData && (lData.host || lData.url || (lData.capa && lData.capa.host))) {
            let host = lData.host || (lData.capa && lData.capa.host) || lData.url;
            if (host && !host.endsWith("/wms") && !host.endsWith("/wfs")) {
              host = host + "/wms";
            }
            return {
              name: layerName,
              title: lData.title || layerName,
              host: host,
            };
          }
        } catch (e) {}
      }

      // 3. gestorMenu.layersDataForWfs
      if (gestorMenu.layersDataForWfs && gestorMenu.layersDataForWfs[layerName]) {
        const wfs = gestorMenu.layersDataForWfs[layerName];
        if (wfs.host) {
          return {
            name: layerName,
            title: wfs.title || layerName,
            host: wfs.host,
          };
        }
      }

      // 4. gestorMenu.items traversal
      if (gestorMenu.items) {
        for (const secKey in gestorMenu.items) {
          const sec = gestorMenu.items[secKey];
          if (sec && sec.itemsComposite) {
            for (const itemKey in sec.itemsComposite) {
              const item = sec.itemsComposite[itemKey];
              if (!item) continue;
              if (item.capas && Array.isArray(item.capas)) {
                for (const c of item.capas) {
                  if (c.nombre === layerName) {
                    return {
                      name: layerName,
                      title: c.titulo || item.titulo || layerName,
                      host: c.host || sec.host,
                    };
                  }
                }
              }
              if (item.capa && item.capa.nombre === layerName) {
                return {
                  name: layerName,
                  title: item.capa.titulo || item.titulo || layerName,
                  host: item.capa.host || sec.host,
                };
              }
              if (item.nombre === layerName) {
                return {
                  name: layerName,
                  title: item.titulo || layerName,
                  host: (item.capa && item.capa.host) || sec.host || "",
                };
              }
            }
          }
        }
      }
    }

    // 5. app.getActiveLayers()
    if (typeof app !== "undefined" && typeof app.getActiveLayers === "function") {
      try {
        const activeLeaflet = app.getActiveLayers();
        for (const k in activeLeaflet) {
          const lyr = activeLeaflet[k];
          if (lyr && (lyr._name === layerName || lyr.name === layerName)) {
            const host = (lyr._source && lyr._source._url) || (lyr.options && lyr.options.url);
            if (host) {
              const title = (lyr._source && lyr._source.options && lyr._source.options.title) || lyr.name || layerName;
              return {
                name: layerName,
                title: title,
                host: host,
              };
            }
          }
        }
      } catch (e) {}
    }

    // 6. addedLayers
    if (typeof addedLayers !== "undefined") {
      const foundAdded = addedLayers.find((l) => l.name === layerName || l.id === layerName);
      if (foundAdded) {
        let host = foundAdded.host || (foundAdded.layer && foundAdded.layer.host);

        // Si no tiene host directo, buscar en servicesLoaded
        if (!host && typeof servicesLoaded !== "undefined") {
          const serviceId = foundAdded.id !== undefined ? foundAdded.id : (typeof layersIndex !== "undefined" ? layersIndex[layerName] : undefined);
          if (serviceId !== undefined && servicesLoaded[serviceId] && servicesLoaded[serviceId].host) {
            host = servicesLoaded[serviceId].host;
          }
        }

        // Si no, buscar en overlayMaps
        if (!host && typeof overlayMaps !== "undefined" && overlayMaps[layerName]) {
          const om = overlayMaps[layerName];
          host = om._url || (om.options && om.options.url);
        }

        if (host) {
          return {
            name: foundAdded.name || foundAdded.id,
            title: foundAdded.title || (foundAdded.layer && foundAdded.layer.title) || foundAdded.name || layerName,
            host: host,
          };
        } else if (foundAdded.layer && (foundAdded.layer.features || foundAdded.layer.type === "FeatureCollection")) {
          return {
            name: foundAdded.name || foundAdded.id,
            title: foundAdded.title || foundAdded.name || layerName,
            isLocalGeoJSON: true,
            localData: foundAdded.layer,
          };
        }
      }
    }

    // 7. Fallback global en overlayMaps
    if (typeof overlayMaps !== "undefined" && overlayMaps[layerName]) {
      const om = overlayMaps[layerName];
      const host = om._url || (om.options && om.options.url);
      if (host) {
        return {
          name: layerName,
          title: (om.options && (om.options.title || om.options.layers)) || layerName,
          host: host,
        };
      }
    }

    return null;
  }

  async executeClip() {
    const capaSelect = document.getElementById("select-capa") || document.getElementById("select-capaarecortar");
    const formatSelect = document.getElementById("select-formato") || document.getElementById("select-formatodedescarga");

    if (!capaSelect || !capaSelect.value) {
      new UserMessage("Por favor seleccione una capa activa para recortar.", true, "warning");
      return;
    }

    const layerName = capaSelect.value;
    const format = formatSelect ? formatSelect.value : "geojson";

    const drawnShape = this.getDrawnShape();
    if (!drawnShape) {
      new UserMessage("Por favor dibuje un polígono o rectángulo sobre el área a recortar.", true, "warning");
      return;
    }

    // Buscar información de la capa
    const layerInfo = this.findLayerInfo(layerName);
    if (!layerInfo) {
      new UserMessage("No se encontró la configuración del servicio para la capa seleccionada.", true, "error");
      return;
    }

    const cleanLayerName = layerName.split(":").pop();
    const clipPoly = this.getClipPolygonTurf(drawnShape);
    if (!clipPoly) {
      new UserMessage("No se pudo construir la geometría del polígono de recorte.", true, "error");
      return;
    }

    let areaKm2 = 0;
    try {
      if (typeof turf !== "undefined") {
        areaKm2 = turf.area(clipPoly) / 1000000;
      }
    } catch (e) {}

    const isVector = this.isVectorLayer(layerName);
    const isRaster = !isVector || format === "geotiff" || format === "geotiff_sld_zip";

    // =========================================================================
    // CASO RÁSTER: Descarga de cobertura GeoTIFF vía WCS + Estilo SLD vía WMS
    // =========================================================================
    if (isRaster) {
      const MAX_RASTER_KM2 = 2500;
      if (areaKm2 > MAX_RASTER_KM2) {
        new UserMessage(
          `El área seleccionada (${areaKm2.toFixed(1)} km²) supera el límite máximo permitido para recorte ráster (${MAX_RASTER_KM2} km²). Por favor dibuje un área menor para evitar saturar el servidor GeoServer.`,
          true,
          "warning"
        );
        return;
      }

      loadingBtn("on", "ejec_gp");
      const loaderEl = document.getElementById("download-loader");
      if (loaderEl) loaderEl.style.display = "none";
      if (typeof hideDownloadLoader === "function") hideDownloadLoader();

      try {
        await this.executeRasterClip(layerName, layerInfo, clipPoly, format, drawnShape, cleanLayerName, areaKm2);
      } catch (err) {
        console.error("Error en recorte ráster:", err);
        new UserMessage(err.message || "Ocurrió un error al procesar el recorte ráster.", true, "error");
      } finally {
        loadingBtn("off", "ejec_gp");
        if (loaderEl) loaderEl.style.display = "none";
        if (typeof hideDownloadLoader === "function") hideDownloadLoader();
      }
      return;
    }

    // =========================================================================
    // CASO VECTORIAL: Recorte geométrico exacto con Turf
    // =========================================================================
    const cqlPolygon = this.getPolygonWkt(drawnShape);
    if (!cqlPolygon) {
      new UserMessage("Geometría de recorte no válida. Por favor vuelva a dibujarla.", true, "warning");
      return;
    }

    const isLocalGeoJSON = !!layerInfo.isLocalGeoJSON;
    const localGeoJSONData = layerInfo.localData;

    loadingBtn("on", "ejec_gp");
    const loaderEl = document.getElementById("download-loader");
    if (loaderEl) loaderEl.style.display = "none";
    if (typeof hideDownloadLoader === "function") hideDownloadLoader();

    try {
      const clipPoly = this.getClipPolygonTurf(drawnShape);
      if (!clipPoly) {
        throw new Error("No se pudo construir el polígono geométrico de recorte.");
      }

      const cleanLayerName = layerName.split(":").pop();

      // CASO A: Capa vectorial local GeoJSON
      if (isLocalGeoJSON && localGeoJSONData && typeof turf !== "undefined") {
        const clippedGeoJSON = this.clipFeatureCollection(localGeoJSONData, clipPoly);

        if (!clippedGeoJSON.features || clippedGeoJSON.features.length === 0) {
          throw new Error("El recorte no arrojó resultados. Ningún elemento cae dentro del polígono trazado.");
        }

        if (format === "kml") {
          const kmlText = this.geojsonToKml(clippedGeoJSON, `${cleanLayerName}_recorte`);
          const blob = new Blob([kmlText], { type: "application/vnd.google-earth.kml+xml" });
          downloadBlob(blob, `${cleanLayerName}_recorte.kml`);
        } else {
          const blob = new Blob([JSON.stringify(clippedGeoJSON, null, 2)], { type: "application/geo+json" });
          downloadBlob(blob, `${cleanLayerName}_recorte.geojson`);
        }

        if (geoProcessingManager && typeof geoProcessingManager.displayResult === "function") {
          geoProcessingManager.displayResult(clippedGeoJSON, drawnShape);
        }

        this.cleanupDrawnShape(drawnShape);
        new UserMessage("Capa recortada y descargada exitosamente.", true, "information");
        return;
      }

      // CASO B: Capa vectorial en GeoServer accesible por WFS
      const rawHost = layerInfo.host || "";
      const wfsUrl = this.getWfsUrl(rawHost);

      if (!wfsUrl) {
        throw new Error("No se pudo derivar la URL del servicio WFS para esta capa.");
      }

      // Detectar la columna de geometría
      const geomField = await this.detectGeometryColumn(wfsUrl, layerName);

      // Calcular BBOX en EPSG:4326 a partir del polígono de recorte
      const bbox = turf.bbox(clipPoly);
      const minX = bbox[0].toFixed(6);
      const minY = bbox[1].toFixed(6);
      const maxX = bbox[2].toFixed(6);
      const maxY = bbox[3].toFixed(6);

      // Construir filtro espacial:
      // Usamos BBOX(geom, minX, minY, maxX, maxY, 'EPSG:4326') que instruye a GeoServer
      // a reproyectar el área de consulta automáticamente a cualquier SRC nativo de la capa
      // (crucial para capas proyectadas en POSGAR/Gauss-Kruger como EPSG:5347 usos_suelo).
      const cqlFilterBbox = `BBOX(${geomField},${minX},${minY},${maxX},${maxY},'EPSG:4326')`;

      // Petición WFS para obtener los elementos intersectantes en GeoJSON
      const geojsonParams = new URLSearchParams({
        service: "WFS",
        version: "1.0.0",
        request: "GetFeature",
        typeName: layerName,
        outputFormat: "application/json",
        srsName: "EPSG:4326",
        cql_filter: cqlFilterBbox,
      });

      let geojsonUrl = `${wfsUrl}?${geojsonParams.toString()}`;
      let geojsonResp = await fetch(geojsonUrl);
      let geojsonText = await geojsonResp.text();

      // Fallback a INTERSECTS si el servidor no admite BBOX con SRC explícito
      if (!geojsonResp.ok || geojsonText.includes("ExceptionReport") || geojsonText.includes("ServiceException")) {
        const fallbackParams = new URLSearchParams({
          service: "WFS",
          version: "1.0.0",
          request: "GetFeature",
          typeName: layerName,
          outputFormat: "application/json",
          srsName: "EPSG:4326",
          cql_filter: `INTERSECTS(${geomField},${cqlPolygon})`,
        });
        const fbResp = await fetch(`${wfsUrl}?${fallbackParams.toString()}`);
        if (fbResp.ok) {
          const fbText = await fbResp.text();
          if (!fbText.includes("ExceptionReport") && !fbText.includes("ServiceException")) {
            geojsonResp = fbResp;
            geojsonText = fbText;
          }
        }
      }
      if (geojsonText.includes("ExceptionReport") || geojsonText.includes("ServiceException")) {
        throw new Error("El servicio WFS rechazó la consulta espacial. Verifique que la capa sea vectorial y admita WFS.");
      }

      let parsedGeoJSON;
      try {
        parsedGeoJSON = JSON.parse(geojsonText);
      } catch (e) {
        throw new Error("La respuesta del servicio no es un GeoJSON válido.");
      }

      if (!parsedGeoJSON.features || parsedGeoJSON.features.length === 0) {
        throw new Error("El recorte no arrojó resultados. No se encontraron geometrías dentro del polígono seleccionado.");
      }

      // Realizar el RECORTE GEOMÉTRICO EXACTO con Turf
      const clippedGeoJSON = this.clipFeatureCollection(parsedGeoJSON, clipPoly);

      if (!clippedGeoJSON.features || clippedGeoJSON.features.length === 0) {
        throw new Error("El recorte no arrojó resultados. Ninguna geometría cae dentro del polígono trazado.");
      }

      // Descarga según formato
      if (format === "kml") {
        const kmlText = this.geojsonToKml(clippedGeoJSON, `${cleanLayerName}_recorte`);
        const blob = new Blob([kmlText], { type: "application/vnd.google-earth.kml+xml" });
        downloadBlob(blob, `${cleanLayerName}_recorte.kml`);
      } else if (format === "geojson") {
        const blob = new Blob([JSON.stringify(clippedGeoJSON, null, 2)], { type: "application/geo+json" });
        downloadBlob(blob, `${cleanLayerName}_recorte.geojson`);
      } else if (format === "shp") {
        // En GeoServer WFS el formato shape-zip no recorta geometrías a nivel submétrica/polígono (solo filtra).
        // Se descarga el GeoJSON recortado exactamente, el cual se puede abrir directamente en QGIS/ArcGIS.
        const blob = new Blob([JSON.stringify(clippedGeoJSON, null, 2)], { type: "application/geo+json" });
        downloadBlob(blob, `${cleanLayerName}_recorte.geojson`);
        new UserMessage("Se descargó en formato GeoJSON con el recorte geométrico exacto (compatible con QGIS y ArcGIS).", true, "information");
      }

      // Renderizar el resultado en el mapa a través del Geoprocessing Manager
      if (geoProcessingManager && typeof geoProcessingManager.displayResult === "function") {
        geoProcessingManager.displayResult(clippedGeoJSON, drawnShape);
      }

      // Eliminar polígono de selección del mapa
      this.cleanupDrawnShape(drawnShape);

      new UserMessage("Capa vectorial recortada y descargada exitosamente.", true, "information");
    } catch (err) {
      console.error(err);
      new UserMessage(err.message || "Ocurrió un error al ejecutar el recorte vectorial.", true, "error");
    } finally {
      loadingBtn("off", "ejec_gp");
      const loaderEl = document.getElementById("download-loader");
      if (loaderEl) loaderEl.style.display = "none";
      if (typeof hideDownloadLoader === "function") hideDownloadLoader();
    }
  }

  async executeRasterClip(layerName, layerInfo, clipPoly, format, drawnShape, cleanLayerName, areaKm2) {
    const rawHost = layerInfo.host || "";
    if (!rawHost) {
      throw new Error("No se pudo obtener la URL del servidor para la capa seleccionada.");
    }

    let wcsHost = rawHost.replace(/\/wms\/?$/i, "/wcs").replace(/\/wfs\/?$/i, "/wcs");
    let wmsHost = rawHost.replace(/\/wcs\/?$/i, "/wms").replace(/\/wfs\/?$/i, "/wms");
    if (!wcsHost.includes("/geoserver/wcs") && wcsHost.includes("/geoserver")) {
      wcsHost = wcsHost.replace(/\/geoserver.*/, "/geoserver/wcs");
    }
    if (!wmsHost.includes("/geoserver/wms") && wmsHost.includes("/geoserver")) {
      wmsHost = wmsHost.replace(/\/geoserver.*/, "/geoserver/wms");
    }

    const bbox = turf.bbox(clipPoly);
    const minX = bbox[0].toFixed(6);
    const minY = bbox[1].toFixed(6);
    const maxX = bbox[2].toFixed(6);
    const maxY = bbox[3].toFixed(6);

    let tiffBlob = null;
    let lastError = "";

    // Calcular resolución adecuada para WCS 1.0.0 (requiere width y height en GeoServer)
    const dx = Math.abs(parseFloat(maxX) - parseFloat(minX));
    const dy = Math.abs(parseFloat(maxY) - parseFloat(minY));
    const aspect = (dx / (dy || 0.0001)) || 1;
    let reqWidth = Math.round(Math.min(1800, Math.max(600, Math.sqrt((areaKm2 || 100) * 10000) * aspect)));
    let reqHeight = Math.round(reqWidth / aspect);
    if (reqWidth > 2000) { reqWidth = 2000; reqHeight = Math.round(reqWidth / aspect); }
    if (reqHeight > 2000) { reqHeight = 2000; reqWidth = Math.round(reqHeight * aspect); }
    if (reqWidth < 300) reqWidth = 300;
    if (reqHeight < 300) reqHeight = 300;

    // 1. Probar WCS 1.0.0 con width y height (estándar GeoServer GeoINTA)
    try {
      const wcs1Url = `${wcsHost}?service=WCS&version=1.0.0&request=GetCoverage&coverage=${encodeURIComponent(layerName)}&bbox=${minX},${minY},${maxX},${maxY}&crs=EPSG:4326&format=GeoTIFF&width=${reqWidth}&height=${reqHeight}`;
      const r1 = await fetch(wcs1Url);
      if (r1.ok) {
        const ct = r1.headers.get("content-type") || "";
        if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
          tiffBlob = await r1.blob();
        } else {
          const txt = await r1.text();
          if (!txt.includes("Exception") && !txt.includes("ServiceException")) {
            tiffBlob = new Blob([txt], { type: "image/tiff" });
          } else {
            lastError = txt;
          }
        }
      } else {
        lastError = `Código HTTP ${r1.status}: ${r1.statusText}`;
      }
    } catch (e) {
      lastError = e.message;
    }

    // 2. Probar WCS 2.0.1 con identificador normalizado (geonode__nombre)
    if (!tiffBlob) {
      try {
        const covId2 = layerName.includes(":") ? layerName.replace(/:/g, "__") : `geonode__${layerName}`;
        const wcs2Url = `${wcsHost}?service=WCS&version=2.0.1&request=GetCoverage&coverageId=${encodeURIComponent(covId2)}&format=image/tiff&subset=Long(${minX},${maxX})&subset=Lat(${minY},${maxY})`;
        const r2 = await fetch(wcs2Url);
        if (r2.ok) {
          const ct = r2.headers.get("content-type") || "";
          if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
            tiffBlob = await r2.blob();
          } else {
            const txt = await r2.text();
            if (!txt.includes("Exception") && !txt.includes("ServiceException")) {
              tiffBlob = new Blob([txt], { type: "image/tiff" });
            }
          }
        }
      } catch (e) {
        console.warn("WCS 2.0.1 no respondió...", e);
      }
    }

    // 3. Fallback adicional con format=image/tiff en WCS 1.0.0
    if (!tiffBlob) {
      try {
        const wcs1bUrl = `${wcsHost}?service=WCS&version=1.0.0&request=GetCoverage&coverage=${encodeURIComponent(layerName)}&bbox=${minX},${minY},${maxX},${maxY}&crs=EPSG:4326&format=image/tiff&width=${reqWidth}&height=${reqHeight}`;
        const r1b = await fetch(wcs1bUrl);
        if (r1b.ok) {
          const ct = r1b.headers.get("content-type") || "";
          if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
            tiffBlob = await r1b.blob();
          }
        }
      } catch (e) {}
    }

    // 4. Fallback con nombre limpio sin prefijo de espacio de trabajo
    if (!tiffBlob && cleanLayerName !== layerName) {
      try {
        const wcsCleanUrl = `${wcsHost}?service=WCS&version=1.0.0&request=GetCoverage&coverage=${encodeURIComponent(cleanLayerName)}&bbox=${minX},${minY},${maxX},${maxY}&crs=EPSG:4326&format=GeoTIFF&width=${reqWidth}&height=${reqHeight}`;
        const rClean = await fetch(wcsCleanUrl);
        if (rClean.ok) {
          const ct = rClean.headers.get("content-type") || "";
          if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
            tiffBlob = await rClean.blob();
          }
        }
      } catch (e) {}
    }

    // 5. Fallback con nombre base sin sufijo hash de GeoNode (ej: 01_p_ep)
    const baseCleanName = cleanLayerName.replace(/_[a-f0-9]{20,}$/i, "");
    if (!tiffBlob && baseCleanName !== cleanLayerName) {
      const candidateNames = [`geonode:${baseCleanName}`, baseCleanName];
      for (const covName of candidateNames) {
        if (tiffBlob) break;
        try {
          const wcsBaseUrl = `${wcsHost}?service=WCS&version=1.0.0&request=GetCoverage&coverage=${encodeURIComponent(covName)}&bbox=${minX},${minY},${maxX},${maxY}&crs=EPSG:4326&format=GeoTIFF&width=${reqWidth}&height=${reqHeight}`;
          const rBase = await fetch(wcsBaseUrl);
          if (rBase.ok) {
            const ct = rBase.headers.get("content-type") || "";
            if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
              tiffBlob = await rBase.blob();
            }
          }
        } catch (e) {}
      }
    }

    // 6. Fallback vía WMS GetMap con formato GeoTIFF nativo de GeoServer
    if (!tiffBlob) {
      const wmsTiffFormats = ["image/geotiff", "image/tiff"];
      for (const wmsFmt of wmsTiffFormats) {
        if (tiffBlob) break;
        try {
          const wmsTiffUrl = `${wmsHost}?service=WMS&version=1.1.1&request=GetMap&layers=${encodeURIComponent(layerName)}&bbox=${minX},${minY},${maxX},${maxY}&width=${reqWidth}&height=${reqHeight}&srs=EPSG:4326&format=${encodeURIComponent(wmsFmt)}`;
          const rWms = await fetch(wmsTiffUrl);
          if (rWms.ok) {
            const ct = rWms.headers.get("content-type") || "";
            if (!ct.includes("xml") && !ct.includes("html") && !ct.includes("text")) {
              tiffBlob = await rWms.blob();
            }
          }
        } catch (e) {}
      }
    }

    if (!tiffBlob) {
      throw new Error(`El servidor ráster (${wcsHost}) no pudo procesar la cobertura seleccionada. Verifique la disponibilidad del servicio. ${lastError ? "Detalle: " + lastError.slice(0, 150) : ""}`);
    }

    // Obtener estilo SLD vía WMS GetStyles
    let sldText = null;
    try {
      const sldUrl = `${wmsHost}?service=WMS&version=1.1.1&request=GetStyles&layers=${encodeURIComponent(layerName)}`;
      const sldResp = await fetch(sldUrl);
      if (sldResp.ok) {
        const txt = await sldResp.text();
        if (!txt.includes("ServiceException") && (txt.includes("<StyledLayerDescriptor") || txt.includes("<sld:StyledLayerDescriptor") || txt.includes("NamedLayer"))) {
          sldText = txt;
        }
      }
    } catch (e) {
      console.warn("No se pudo obtener el estilo SLD de la capa:", e);
    }

    // Empaquetar y descargar
    if (format === "geotiff_sld_zip") {
      const jszipClass = await this.ensureJSZip();
      if (!jszipClass) {
        downloadBlob(tiffBlob, `${cleanLayerName}_recorte.tif`);
        new UserMessage("Se descargó el archivo GeoTIFF (la librería ZIP no estuvo disponible).", true, "information");
      } else {
        const zip = new jszipClass();
        zip.file(`${cleanLayerName}_recorte.tif`, tiffBlob);
        if (sldText) {
          zip.file(`${cleanLayerName}_estilo.sld`, sldText);
        }
        const readme = `========================================================================
RECORTE RÁSTER - INTA DIGITAL GEO
========================================================================
Capa ráster: ${cleanLayerName} (${layerName})
Fecha y hora de descarga: ${new Date().toLocaleString("es-AR")}
Área aproximada del recorte: ${areaKm2.toFixed(2)} km²
Servidor WCS origen: ${wcsHost}

Extensión espacial BBOX (EPSG:4326 - WGS84):
  Oeste (Longitud Mínima): ${minX}°
  Sur (Latitud Mínima):    ${minY}°
  Este (Longitud Máxima):  ${maxX}°
  Norte (Latitud Máxima):  ${maxY}°
========================================================================
`;
        zip.file("LEEME_METADATOS.txt", readme);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        downloadBlob(zipBlob, `${cleanLayerName}_recorte.zip`);
      }
    } else {
      downloadBlob(tiffBlob, `${cleanLayerName}_recorte.tif`);
    }

    // Representación visual del BBOX recortado en el mapa
    const bboxPolygon = turf.bboxPolygon(bbox);
    bboxPolygon.properties = {
      title: `Recorte Ráster: ${cleanLayerName}`,
      layer: cleanLayerName,
      areaKm2: areaKm2.toFixed(2),
      type: "raster_clip",
    };
    const resultGeoJSON = {
      type: "FeatureCollection",
      features: [bboxPolygon],
    };

    if (geoProcessingManager && typeof geoProcessingManager.displayResult === "function") {
      geoProcessingManager.displayResult(resultGeoJSON, drawnShape);
    }

    this.cleanupDrawnShape(drawnShape);
    new UserMessage(`Recorte ráster (${areaKm2.toFixed(1)} km²) descargado exitosamente.`, true, "information");
  }
}
