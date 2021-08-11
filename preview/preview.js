module.exports = function(metadata) {
  return /*html*/`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="initial-scale=1,maximum-scale=1,user-scalable=no" />
      <script src="https://cdn.maptiler.com/maplibre-gl-js/v1.13.0-rc.4/mapbox-gl.js"></script>
      <link rel="stylesheet" href="https://cdn.skypack.dev/maplibre-gl/dist/maplibre-gl.css" />  <style>
        #map {position: absolute; top: 0; right: 0; bottom: 0; left: 0;}
      </style>
    </head>
    <body>
      <div id="map"></div>
      <script type="module">
        import { Map, NavigationControl} from 'https://cdn.skypack.dev/maplibre-gl'
        var map = new Map({
          container: 'map',
          style: {
            "version": 8,
            "name": "simple",
            "sources": {
              "raster": {
                "type": "raster",
                "tiles": ["${metadata.tiles}"],
                "minzoom": ${metadata.minzoom},
                "maxzoom": ${metadata.maxzoom + 2},
                "tileSize": 256
              }
            },
            "layers": [{
              "id": "sample",
              "type": "raster",
              "source": "raster"
            }]
          },
          center: [${(metadata.bounds[0] + metadata.bounds[2])/2}, ${(metadata.bounds[1] + metadata.bounds[3])/2}],
          zoom: ${(metadata.maxzoom + metadata.minzoom)/2},
          maxZoom: 23,
          hash: true
        });
        map.addControl(new NavigationControl());
      </script>
    </body>
    </html>
  `
}