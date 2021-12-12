const {getZoomFactor} = require("../lib/overZoom.js");
const opengraph = require("./opengraph.js");
const Style = require("./style.js");
//${metadata.name.replace("-","_").split("_").join(" ")}
module.exports = (metadata) => {
  return /*html*/`
  <!DOCTYPE html>
  <html>

  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${opengraph({
      PAGE_TITLE: "Preview"
    })}
    <link rel='stylesheet' href='https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/1.3.2/mapbox-gl.css' integrity='sha512-Wfg30xEjUW9qApYaFwgoGEUsojY1RB/hAkiam9ByZ5g86HbOQNer6NEosQ13DdMbx0DvSrtUXL1l9f9MEoRL0w==' crossorigin='anonymous'/>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/mapbox-gl/1.3.2/mapbox-gl.js' integrity='sha512-wBMKjRtNRvaLgvi2agQrlJOwyYyWZpotNM0xeLHwxBGNX40Co4O+j6eMfaYN2KyfMfShNKzZm7ar95j8FdCtIA==' crossorigin='anonymous'></script>

    <link href="https://fonts.googleapis.com/css?family=Lato" rel="stylesheet">
    <style>
      html, body {
        height: 100%;
      }
      body {
        background: #fff;
        color: #333;
        margin: 0;
        font-family: "Segoe UI", "Lato", sans-serif;
      }

      #map {
        position: absolute;
        left:0;
        top:0;
        bottom:0;
        right: 30%;
        height:100%;
      }

      #sidebar {
        position: absolute;
        top: 0;
        right: 0;
        bottom: 0;
        width: 30%;
        z-index: 9999;
        overflow: auto;
        border-left: thin solid lightgray;
      }

      h3,
      h6 {
        margin: 8px;
      }

      #layerList,
      #propertyList {
        margin: 8px;
      }

      #layerList div div {
        width: 15px;
        height: 15px;
        display: inline-block;
      }

      .inner {
        padding: 10px;
      }

      #map canvas {
        cursor: crosshair;
      }

      #loader {
        background: white;
        position: absolute;
        top: 0;
        left: 0;
        bottom: 0;
        width: 100%;
        z-index: 9998;
      }

      .loader-fadeout {
        -webkit-transition: opacity 0.3s ease-in-out;
        -moz-transition: opacity 0.3s ease-in-out;
        -ms-transition: opacity 0.3s ease-in-out;
        -o-transition: opacity 0.3s ease-in-out;
        opacity: 0;
        z-index: 0!important;
      }

      #loader-img {
        background: white;
        position: absolute;
        z-index: 9999;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      @media screen and (max-width:768px) {
        #sidebar {
          display: none;
        }
        #map {
          right: 0;
          width: 100%;
        }
      }
      /*custom page styles*/
      #extrude {
        position: absolute;
        top: 150px;
        right: 10px;
        background: white;
        width: 30px;
        height: 30px;
        padding: 7px 0;
        text-align: center;
        font-size: larger;
        cursor: pointer;
        font-weight: bold;
        line-height: 15px;
        box-shadow: 0px 0px 0px 2px rgba(0,0,0,0.1);
      }
      .active {
        font-weight: bolder;
        color: orange;
      }
      /**/
    </style>
  </head>

  <body>
    <div id="map">
      <!-- <div id="loader">
        <div id="loader-img"><img src="/assets/loader.gif" /></div>
      </div> -->
    </div>
    <div id="sidebar">
      <div class="inner">
        <h3>Vector Tile Preview</h3>
        <h6><a href="../">Return to the Tileserver</a></h6>
        <div id="zoomlevel"></div>
        <div id="layerList"></div>
        <pre id="propertyList"></pre>
      </div>
    </div>
    <script>
      var map = new mapboxgl.Map({
        container: 'map',
        hash: false,
        attributionControl: true,
        style: ${JSON.stringify(Style())},
        pitch: 0,
        bearing: 0,
        center: [${(metadata.bounds[0] + metadata.bounds[2])/2}, ${(metadata.bounds[1] + metadata.bounds[3])/2}],
        zoom: ${(metadata.maxzoom + metadata.minzoom)/2},
        hash: true,
        maxZoom: ${metadata.maxzoom} + ${getZoomFactor()},
        minZoom: ${metadata.minzoom}
      });

      map.addControl(new mapboxgl.NavigationControl())
      map.addControl(new mapboxgl.GeolocateControl({
        positionOptions: {
          enableHighAccuracy: true
        },
        trackUserLocation: true
      }));

      map.on("load", () => {
        buildMap()
      });
      document.getElementById('zoomlevel').innerHTML = '<pre>Current Zoom Level: '+ (map.getZoom()).toFixed(2) + '</pre>';

      function buildMap() {
        const format = ${(metadata.format) ? `"${metadata.format}"` : null};
        if (!format) {
          alert("Format is missing. The map cannot render.")
          return
        }
        if (format == "pbf") {
          var mapLayers = [];
          /*[
            {
              "id": "background",
              "type": "background",
              "paint": {
                "background-color": "whitesmoke"
              },
              "layout": {
                "visibility": "visible"
              }
            }
          ]*/
          const layersArray = ${JSON.stringify(metadata.vector_layers,0,2)};

          if (!layersArray.length) return
          for (var l=0; l < layersArray.length; l++) {
            mapLayers.push(
            {
              "id": layersArray[l].id,
              "type": "fill",
              "source": "preview",
              "source-layer": layersArray[l].id,
              "paint": {
                "fill-color": "#121212",
                "fill-outline-color": "orange"
              },
              "layout": {
                  "visibility": "visible",
                },
              "filter": ["==", "$type", "Polygon"]
            },
            {
                "id": layersArray[l].id + "" + 2,
                "type": "fill-extrusion",
                "source": "preview",
                "source-layer": layersArray[l].id,
                "paint": {
                  "fill-extrusion-color": "whitesmoke",
                  "fill-extrusion-height": {
                    "type": "identity",
                    "property": "render_height"
                  },
                  "fill-extrusion-opacity": 0.5
                },
                "layout": {
                  "visibility": "none",
                },
                "filter": ["all",
                  ["has", "render_height"],
                  ["==", "$type", "Polygon"]
                ]
              },
            {
              "id": layersArray[l].id + "" + 1,
              "type": "line",
              "source": "preview",
              "source-layer": layersArray[l].id,
              "paint": {
                "line-color": "orange",
                "line-width": 2
              },
              "layout": {
                  "visibility": "visible",
                },
            },
            {
              "id": layersArray[l].id + "" + 3,
              "type": "circle",
              "source": "preview",
              "source-layer": layersArray[l].id,
              "paint": {
                "circle-radius": {
                  "stops": [
                    [0,1],
                    [13, 5],
                    [19,14]
                  ]
                },
                "circle-color": "orange"
              },
              "layout": {
                  "visibility": "visible",
                },
            });
          }
          console.log(mapLayers);
          map.setStyle({
            "version": 8,
            "name": "blank",
            "sources": {
              "openmaptiles": {
                "type": "vector",
                "url": ""
              },
              'preview': {
                "type": "vector",
                "tiles": ["${metadata.tiles}"],
                "maxzoom": ${metadata.maxzoom}
              }
            },
            "layers": mapLayers
          });
          // map.addControl(new MapboxInspect({
          //   showInspectMap: true,
          //   showInspectButton: true,
          //   selectThreshold: 10,
          //   showMapPopup: true,
          //   showMapPopupOnHover: false,
          //   showInspectMapPopupOnHover: false
          // }));
          
          map.on('click', function(e) {
            var features = map.queryRenderedFeatures(e.point);
            console.log(features)
            if (features.length) {
              document.getElementById('propertyList').innerHTML = JSON.stringify(features[0].properties, null, 2);
            }
          });
          
          var layerSideList = document.getElementById('layerList');

          mapLayers.map(function(layer) {
            console.log(layer)
            const checked = (layer.layout.visibility === 'visible') ? ' checked' : '';
            layerSideList.innerHTML += '<input type="checkbox" name="layer" value="' + layer.id +'"' + checked + '>'  + layer.id + ' ' + layer.type + '<br>'
          });
          
          layerSideList.addEventListener('change', function(e) {
            console.log(e);
            var clickedLayer = e.target.value;
            if (!e.target.checked) {
              map.setLayoutProperty(clickedLayer, "visibility", "none");
            }else{
              map.setLayoutProperty(clickedLayer, "visibility", "visible");
            }
          });
        } else {
          var tilejson = "/meta/" + tile + "-tilejson.json";
          map.addSource("raster-tiles", {
            "type": "raster",
            "url": tilejson
  /*          "tileSize": 256,
            "maxzoom": maxzoom*/
          });
          var rasterTilePreview = {
            "id": "rasterTilePreview",
            "type": "raster",
            "source": "raster-tiles"
          };
          map.addLayer(rasterTilePreview);
        }
        /*setTimeout(function() {
          document.getElementById('loader').className = "loader-fadeout";
        }, 500);*/
        map.on('zoomend', function() {
          document.getElementById('zoomlevel').innerHTML = '<pre>Current Zoom Level: '+ (map.getZoom()).toFixed(2) + '</pre>';
        })
      }
    </script>
  </body>
  </html>
  `
}