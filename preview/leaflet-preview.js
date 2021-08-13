module.exports = function(metadata) {
  return /*html*/`
  <!DOCTYPE html>
<html>
  <head>
    <title>Leaflet Preview</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <link
      rel="stylesheet"
      href="https://unpkg.com/leaflet@1.5.1/dist/leaflet.css"
      integrity="sha512-xwE/Az9zrjBIphAcBb3F6JVqxf46+CDLwfLMHloNu6KEQCAWi6HcDUbeOfBIptF7tcCzusKFjFw2yuvEpDL9wQ=="
      crossorigin=""
    />
    <script
      src="https://unpkg.com/leaflet@1.5.1/dist/leaflet.js"
      integrity="sha512-GffPMF3RvMeYyc1LWMHtK8EbPv0iNZ8/oTtHPx9/cc2ILxQ+u905qIwdpULaqDkyBKgOaB57QTMg7ztg8Jm2Og=="
      crossorigin=""
    ></script>
    <script src='https://cdnjs.cloudflare.com/ajax/libs/leaflet-hash/0.2.1/leaflet-hash.min.js' integrity='sha512-0A4MbfuZq5Au9EdpI1S5rUTXlibNBi8CuZ/X3ycwXyZiCjNzpiO9YH6EMqPgzZm6vfNCuZStBQHjnO17nIC0IQ==' crossorigin='anonymous'></script>
    <style type="text/css">
      body {
        margin: 0;
        padding: 0;
      }
      html,
      body,
      #map {
        width: 100%;
        height: 100%;
      }
    </style>
  </head>
  <body>
    <div id="map"></div>
    <script>
      var view = [${(metadata.bounds[1] + metadata.bounds[3])/2}, ${(metadata.bounds[0] + metadata.bounds[2])/2}];
      var map = L.map("map", {
        loadingControl: true,
        maxZoom: 23
      }).setView(view, ${(metadata.minzoom + metadata.maxzoom)/2})
      var hash = new L.Hash(map);
      const fastify = new L.tileLayer(
        "${metadata.tiles}",
        {
          minZoom: ${metadata.minzoom},
          maxZoom: ${metadata.maxzoom},
          tms: false,
          attribution: "served by wmts-server",
        }
      ).addTo(map);

      map.on("contextmenu", (e) => {
        console.log(e);
      });

      const go = new L.tileLayer(
        "https://www2.ci.lancaster.oh.us/tileserver/services/2020_fairfield_3in_z21/tiles/{z}/{x}/{y}.jpg",
        {
          minZoom: 0,
          maxZoom: 22,
          tms: false,
          attribution: "Generated by TilesXYZ"
        }
      );
      const agol = new L.tileLayer(
        "https://tiles.arcgis.com/tiles/CRjnKyCe3OfYTMC3/arcgis/rest/services/2020_Fairfiled_3857_Cache/MapServer/tile/{z}/{y}/{x}",
        {
          minZoom: 0,
          maxZoom: 22,
          tms: false
        }
      );
      const error = new L.tileLayer(
        "http://localhost:3000/non_existent_tile/{z}/{x}/{y}",
        {
          minZoom: 0,
          maxZoom: 22,
          tms: false,
        }
      );
      L.GridLayer.GridDebug = L.GridLayer.extend({
        createTile: function (coords) {
          const tile = document.createElement('div');
          tile.style.outline = '1px solid red';
          tile.style.fontWeight = 'normal';
          tile.style.fontSize = '14pt';
          tile.style.color = '#fff';
          tile.innerHTML = [coords.z, coords.x, coords.y].join(' / ');
          return tile;
        },
      });

      L.gridLayer.gridDebug = function (opts) {
        return new L.GridLayer.GridDebug(opts);
      };
      const gridLayer = L.gridLayer.gridDebug()
      map.addLayer(gridLayer);
      const layerControl = new L.control.layers(
        {
          ${metadata.name.replace("-", "_").split("_").join(" ").toUpperCase()}: fastify,
          Go: go,
          AGOL: agol,
          Error: error
        },
        {"Grid": gridLayer},
        {
          collapsed: false,
        }
      ).addTo(map);
      let time = Date.now();
      // map.eachLayer(function (layer) {
      //   if (!layer.on) return;
      //   layer.on({
      //     // loading: function () {
      //     //   time = Date.now();
      //     // },
      //     load: function () {
      //       time = Date.now() - time;
      //       console.log(time);
      //       time = null
      //     },
      //   });
      // });

      map.on("baselayerchange", function (layer) {
        time = Date.now();
        const name = layer.name
        map.eachLayer(function (layer) {

          // if (!layer.on) return;
          layer.on({
            // loading: function () {
            //   time = Date.now();
            //   console.log(time);
            // },
            load: function () {
              time = Date.now() - time;
              console.log(name + " load time:", time);
              time = null
            },
          });
        });
      });

    </script>
  </body>
</html>

  `
}