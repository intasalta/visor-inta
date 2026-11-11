/**
 * File Layer handles KML, JSON, GeoJson, WKT, TXT, GPX and Zip (shapefile) file types from an input file
 * Used libraries: 
 * · Shpafiles: https://github.com/calvinmetcalf/shapefile-js
 * · KML, WKT, TOPOJSON, GPX: https://github.com/mapbox/leaflet-omnivore
 * · GeoJSON: Leaflet
 **/

 class FileLayer {
    constructor(){
        this.file = null;
        this.fileName = null;
        this.format = null;
        this.layerData = null;
        this.layerType = null;
        this.fileSize = null;
        this.layer = null;
        this.id = null;
    }

    getFileName(){
        return this.fileName;
    }

    getLayer(){
        return this.layer;
    }

    getRawLayerData(){
        return this.layerData;
    }

    getFormat(){
        return this.format;
    }

    getLayerType(){
        return this.layerType;
    }

    getId(){
        return this.id;
    }

    getGeoJSON(){
        // we assume that zip is the format for shapefile, and tif/tiff for GeoTIFF
        if(this.format == 'zip' || this.format == 'tif' || this.format == 'tiff' || this.layerType == 'geotiff'){
            return this.layer;
        }

        return (this.layer && typeof this.layer.toGeoJSON === 'function') ? this.layer.toGeoJSON() : this.layer;
    }

    getFileSize(measure){
        if (measure && typeof measure == 'string') {
            if(measure == 'kb') {
                return this.fileSize/1000;
            }
        }
        return this.fileSize;
    }

    handleFile(file){
        return new Promise((resolve,reject)=>{
            // Check file exists
            if(file==undefined || file==null) reject('Ningún archivo seleccionado');

            this.file = file;
            this.fileName = file.name;
            this.format = file.name.split(".").pop().toLowerCase();
            this.fileSize = file.size;
            this.id = this.format + (''+new Date().getTime()).substr(8);
            // Fetch the file
            fetch(URL.createObjectURL(file))
            .then((response)=>{
                // Parse the response
                let responseType = this.getResponseType();
                // Parse the response to the required format ex: response.text(), response.json()
                this.handleResponse(response,responseType).then((data)=>{
                    // Converts using the libraries
                    this.getGeojson(data).then((result)=>{
                        this.layer = result;
                        resolve();
                    }).catch((error)=>{
                        console.error("error converting to geoJSON");
                        reject(error)
                    })
                }).catch((error)=>{
                    console.error("error reading the file");
                    reject(error)
                })
            }).catch((error)=>{
                console.error("error getting the file");
                reject(error)
            })
        });
    }

    /**
     * Converts different data to the expected format and returns a geoJSON or GeoRasterLayer
     * @param {String|ArrayBuffer} data from response
     * @returns a geoJSON object or Leaflet Layer
     */
    getGeojson(data){
        return new Promise((resolve,reject)=>{
            let layer = null;
            switch (this.format) {
                case 'zip':
                    // Its necessary return the promise, only in this case because shp resolves in a promise
                    this.layerType = 'shapefile';
                    return shp(data).then((parsedLayer)=>{
                        resolve(parsedLayer);
                    }).catch(()=>{
                        reject(`El archivo ${this.fileName} no pudo ser procesado, verifíquelo e intente nuevamente.`)
                    })
                    break;
                case 'tif':
                case 'tiff':
                    this.layerType = 'geotiff';
                    const ensureGeoRasterLibs = async () => {
                        if (typeof parseGeoraster === 'function' && typeof GeoRasterLayer === 'function') {
                            return true;
                        }
                        // Esperar a que Leaflet (window.L) esté disponible si aún está cargando
                        if (typeof L === 'undefined') {
                            await new Promise((res) => {
                                let attempts = 0;
                                const timer = setInterval(() => {
                                    attempts++;
                                    if (typeof L !== 'undefined' || attempts > 30) {
                                        clearInterval(timer);
                                        res();
                                    }
                                }, 100);
                            });
                        }
                        // Cargar parseGeoraster si no estuviera disponible
                        if (typeof parseGeoraster !== 'function') {
                            await new Promise((res) => {
                                const s = document.createElement('script');
                                s.src = 'src/js/plugins/FileLayer/georaster/georaster.browser.bundle.min.js';
                                s.onload = res;
                                s.onerror = res;
                                document.head.appendChild(s);
                            });
                        }
                        // Cargar GeoRasterLayer si no estuviera disponible
                        if (typeof GeoRasterLayer !== 'function') {
                            await new Promise((res) => {
                                const s = document.createElement('script');
                                s.src = 'src/js/plugins/FileLayer/georaster/georaster-layer-for-leaflet.min.js';
                                s.onload = res;
                                s.onerror = res;
                                document.head.appendChild(s);
                            });
                        }
                        return typeof parseGeoraster === 'function' && typeof GeoRasterLayer === 'function';
                    };

                    ensureGeoRasterLibs().then((ready) => {
                        if (!ready) {
                            return reject('Las librerías de lectura GeoTIFF no se pudieron inicializar en el navegador.');
                        }
                        if (typeof registerArgentineProjections === 'function') {
                            try { registerArgentineProjections(); } catch (e) {}
                        }
                        return parseGeoraster(data).then((georaster) => {
                            try {
                                if (typeof registerArgentineProjections === 'function') {
                                    try { registerArgentineProjections(); } catch (e) {}
                                }
                                const rasterLayer = new GeoRasterLayer({
                                    georaster: georaster,
                                    opacity: 0.85,
                                    resolution: 256
                                });
                                rasterLayer.type = 'geotiff';
                                rasterLayer._uneditable = true;
                                rasterLayer.georaster = georaster;
                                this.layer = rasterLayer;
                                resolve(rasterLayer);
                            } catch (err) {
                                console.error("Error al renderizar GeoRasterLayer:", err);
                                reject(`No se pudo renderizar el archivo GeoTIFF ${this.fileName}: ${err.message || err}`);
                            }
                        }).catch((err) => {
                            console.error("GeoTIFF parse error:", err);
                            reject(`El archivo GeoTIFF ${this.fileName} no pudo ser procesado. Verifique que sea un ráster georreferenciado válido.`);
                        });
                    }).catch((err) => {
                        reject(`Error cargando librerías GeoTIFF: ${err.message || err}`);
                    });
                    break;
                case 'json':
                case 'geojson':
                    if (data.type == 'Topology') {
                        this.layerType = 'topoJSON';
                        layer = omnivore.topojson.parse(data);
                    }else{
                        this.layerType = 'geoJSON';
                        layer = L.geoJSON(data);
                    }
                    break;
                case 'kml':
                    this.layerType = 'kml';
                    layer = omnivore.kml.parse(data);
                    break;
                case 'txt':
                case 'wkt':
                    this.layerType = 'wkt';
                    layer = omnivore.wkt.parse(data);
                    break;
                case 'gpx':
                    this.layerType = 'gpx';
                    layer = omnivore.gpx.parse(data);
                    break;
                default:
                    break;
            }

            // Se comprueba que layer haya sido resuelto y que disponga de layers
            if(this.layerType !== 'geotiff' && (layer == null || Object.keys(layer._layers || {}).length == 0)){
                reject(`El archivo ${this.fileName} no pudo ser procesado, verifíquelo e intente nuevamente.`);
            }else if (layer != null) {
                resolve(layer);
            }
        })
    }

    /**
     * Convert the body text of a response to the desired format type (json, text, arrayBuffer)
     * @param {*} response 
     * @param {String} responseType 
     * @returns promise which resolves with the result of parsing the body text
     */
    handleResponse(response,responseType){
        return new Promise((resolve,reject)=>{
            switch (responseType) {
                case 'text':
                    response.text().then((data)=>{
                        this.layerData = data;
                        resolve(data);
                    });
                    break;
                    case 'json':
                    response.json().then((data)=>{
                        this.layerData = data;
                        resolve(data);
                    });
                    break;
                    case 'arrayBuffer':
                    response.arrayBuffer().then((data)=>{
                        this.layerData = data;
                        resolve(data);
                    });
                    break;
                default:
                    reject('invalid file');
            }
        })
    }

    getResponseType(){
        /**
         * An object to retrieve the type of response, it is used to parse the response of a fetch
         */
        let responseType = {
            'txt':'text',
            'wkt':'text',
            'gpx':'text',
            'kml':'text',
            'json':'json',
            'geojson':'json',
            'zip':'arrayBuffer',
            'tif':'arrayBuffer',
            'tiff':'arrayBuffer'
        };

        return responseType[this.format];
    }
}