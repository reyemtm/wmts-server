require('dotenv').config()
const fs = require("fs")
const mercator = require("global-mercator")
const path = require('path')
const tiletype = require('@mapbox/tiletype')
const wmts = require('wmts')
const { dbConnector, GetTileJSON, dbGetMetadata } = require("../lib/dbConnector");

// Task List
//TODO split out raster server
//TODO split out pbf server minimal setup like mbtiles server tobin bradley or mbview
//TODO add sequalize feature server

const {
  overZoom,
  getZoomFactor
} = require("../lib/overZoom.js")


/*WMTS*/
const {
  mbtilesNotFound,
  // invalidTile,
  tileNotFound,
  invalidVersion,
  invalidService,
  getQuery,
  invalidQuery
} = require('../lib/utils.js')

module.exports = function(app, options, done) {

  const { COOKIENAME, KEYS, TILESDIR, HOST, PORT, PROTOCOL } = options;


  //protect route if keys exist
  app.register(require("../lib/jwtAuth"), {
    keys: KEYS,
    cookieName: COOKIENAME
  })

  // see https://github.com/DenisCarriere/mbtiles-server/blob/master/routes/wmts.js 

  app.get('/:database/tilejson', GetTileJSONRoute)
  app.get('/WMTS', (req, reply) => reply.redirect('/WMTS/1.0.0'))
  app.get('/WMTS/1.0.0', GetWMTSLayers)
  app.get('/:database/WMTS/1.0.0/WMTSCapabilities.xml', GetCapabilitiesRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0', GetTileKVP)
  app.get('/:database/WMTS', GetCapabilitiesKVP)
  // app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
  app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+)', GetTileRESTful)
  app.get("/:database/map", (req, reply) => {
    try {
      const db = dbConnector(TILESDIR, req.params.database);
      const metadata = dbGetMetadata(db, req.params.database)
      let preview;
      if (metadata.format && ["jpg", "jpeg", "png", "webp"].includes(metadata.format.toLowerCase())) {
        preview = require("../templates/leaflet-preview.js");
        reply.type("text/html").send(preview(metadata))
      } else if (metadata.format && ["pbf", "mvt"].includes(metadata.format.toLowerCase())) {
        preview = require("../templates/mapbox-preview.js");
        reply.type("text/html").send(preview(metadata))
      } else {
        reply.status(404).send({ error: "Not Found" })
      }
    } catch (err) {
      app.log.error("Error with map preview: " + err);
      reply.status(500).send(err)
    }
  })

  function GetTileJSONRoute (req, reply) {
    const metadata = GetTileJSON(TILESDIR, req.params.database);
    if (!metadata.error) {
      reply.send(metadata)
    }else{
      reply.status(404).send(metadata)
    }
  }

  /**
   * GetWMTSLayers
   * @param {Reqeust} req 
   * @param {Response} reply 
   * @returns 
   */
  function GetWMTSLayers(reply) {
    const files = fs.readdirSync(TILESDIR);
    const mbtiles = files.filter(f => path.extname(f) === ".mbtiles")
    return mbtilesListMetadataToXML(mbtiles, reply)
  }

  function mbtilesListMetadataToXML(databases, reply) {
    return mbtilesMedataToXML(databases[3], reply)
  }

  /**
   * GetCapabilities RESTful
   *
   * @param {Request} req
   * @param {Response} reply
   */
  function GetCapabilitiesRESTful(req, reply) {
    const database = req.params.database;
    const layer = database.replace(".mbtiles", "") //TODO this should read from the metadata
    if (!fs.existsSync(path.join(TILESDIR, database))) return mbtilesNotFound(req.url, layer, database, reply)
    return mbtilesMedataToXML(database, reply)
  }

  /**
   * GetTile KVP
   *
   * @param {Request} req
   * @param {Response} reply
   * @example
   * // http://localHOST:5000/default/wmts?request=GetTile&version=1.0.0&service=wmts&tilecol=0&tilerow=0&tilematrix=0
   */
  function GetTileKVP(req, reply) {
    const {
      tilecol,
      tilerow,
      tilematrix,
      request,
      version,
      service
    } = getQuery(req)
    const x = Number(tilecol)
    const y = Number(tilerow)
    const z = Number(tilematrix)
    const tile = [x, y, z]
    const url = req.url
    const database = req.params.database;
    const layer = database.replace(".mbtiles", "")

    switch (request) {
      case 'gettile':
        // validation
        if (version !== '1.0.0') return invalidVersion(url, layer, database, reply)
        if (service !== 'wmts') return invalidService(url, layer, database, 'wmts', reply)
        if (!tilecol) return invalidQuery(url, layer, database, 'tilecol', reply)
        if (!tilerow) return invalidQuery(url, layer, database, 'tilerow', reply)
        if (!tilematrix) return invalidQuery(url, layer, database, 'tilematrix', reply)
        if (!fs.existsSync(path.join(TILESDIR, database))) return mbtilesNotFound(url, layer, database, reply)
        if (!mercator.validTile(tile)) return invalidTile(url, layer, tile, reply)

        try {
          const db = dbConnector(TILESDIR, database)
          if (!db) throw new Error("Could not connect to database")
          const y = path.parse(request.params.y).name(1 << z) - 1 - y
          return dbGetTile(db, [z, x, (1 << z) - 1 - y], reply)
        } catch (err) {
          app.log.error("GetTileKVP Error: " + err)
          return reply.status(404).send(err)
        }
    }
  }

  /**
   * GetTile RESTful
   *
   * @param {Request} req
   * @param {Response} reply
   */
  function GetTileRESTful(req, reply) {
    const x = req.params.x || req.query.TILECOL
    const y = path.parse(req.params.y).name || req.query.TILEROW
    const z = req.params.z || req.query.TILEMATRIX
    const tile = [x, y, z]
    const url = req.url
    const database = req.params.database;

    const layer = database.replace(".mbtiles", "")
    // if (!fs.existsSync(path.join(TILESDIR, database))) return mbtilesNotFound(url, layer, filepath, res)
    if (!mercator.validTile(tile)) return invalidTile(url, layer, tile, reply)

    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      return dbGetTile(db, [z, x, (1 << z) - 1 - y], reply)
    } catch (err) {
      app.log.error("GetTileRestful Error: " + err)
      return reply.status(404).send(err)
    }
  }

  /**
   * MBTiles Metadata to XML
   *
   * @param {string} database
   * @param {Response} reply
   */
  function mbtilesMedataToXML(database, reply) {
    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      const rows = db.prepare(`SELECT name, value FROM metadata where name in ('name', 'attribution','bounds','center', 'description', 'maxzoom', 'minzoom', 'pixel_scale', 'format')`).all()
      if (!rows) {
        reply.status(204).send('No metadata present')
      } else {
        const metadata = {};
        rows.forEach(r => {
          let value = (isNaN(r.value)) ? r.value : Number(r.value)
          if (r.value.split(",").length > 1) {
            const array = r.value.split(",")
            value = array.reduce((i, v) => [...i, Number(v)], [])
          }
          if (r.name === "json" && r.value) {
            const json = JSON.parse(r.value)
            r.name = "vector_layers"
            value = json["vector_layers"]
          }
          metadata[r.name] = value
        })
        const xml = wmts({
          url: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${database.replace(".mbtiles", "")}/WMTS`,
          title: metadata.name,
          minzoom: metadata.minzoom,
          maxzoom: metadata.maxzoom + getZoomFactor(metadata.format), //over zoom option,
          abstract: metadata.description,
          bbox: metadata.bounds,
          format: (metadata.format === "jpg") ? "jpeg" : metadata.format,
          spaces: 2
        })
        reply.type('text/xml');
        return reply.send(xml)
      }
    } catch (err) {
      app.log.error("mbtilesMedataToXML Error: " + err)
      reply.status(500).send('Error fetching metadata: ' + err + '\n')
    }
  }

  function GetCapabilitiesKVP(req, reply) {
    const db = req.params.database
    // const url = req.url

    const {
      request
    } = getQuery(req)
    // if (!fs.existsSync(filepath)) return mbtilesNotFound(url, layer, filepath, reply)

    // const mbtiles = dbConnector(TILESDIR, filepath, reply)
    switch (request) {
      case 'getcapabilities':
        // if (version !== '1.0.0') return invalidVersion(url, layer, filepath, reply)
        // if (service !== 'wmts') return invalidService(url, layer, filepath, 'wmts', reply)
        return mbtilesMedataToXML(db, reply)
      case undefined:
        return mbtilesMedataToXML(db, reply)
    }
    return GetTileKVP(req, reply)
  }

  /*--END WMTS--*/

  /*--HELPERS--*/

  async function dbGetTile(db, t, reply) {
    const tile = t.map(i => Number(i))

    try {
      //overZoom function, returns a buffer of the overzoomed tile, returns false, or throws error
      //try/catch are in the onverZoom function
      const timer = {
        now: Date.now(),
        then: Date.now()
      }
      const data = await overZoom(db, tile);

      if (data) {
        // reply.header("Content-Length", data.buffer.byteLength)
        reply.header("Content-Type", `image/${data.metadata.format}`)
        // reply.header("X-Powered-By", "OverZoom Beta")
        return reply.send(data.buffer)
      }

      const stmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?');
      const row = stmt.get(tile)

      if (!row) {
        app.log.warn("getTileError, no data found: ");
        reply.status(204)
        return
        // reply.type("image/png");
        // const emptyPng =
        //   "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
        // return Buffer.from(emptyPng, "base64");
      }
      Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
        reply.header(h[0], h[1])
      )

      reply.send(row.tile_data)

    } catch (err) {
      app.log.error("getTileError, unknown: " + err)
      reply.status(500).send(err) //TODO merge these routes with the original WMTS error handlers //TODO check all error status codes
    }
  }

  /*--END HELPERS */
  done()

}