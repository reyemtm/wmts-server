require('dotenv').config()
const fs = require("fs")
const fastify = require('fastify')
const tiletype = require('@mapbox/tiletype')
const path = require('path')
const DB = require("better-sqlite3")
const mercator = require("global-mercator")

/*CONFIG*/
//TODO have argv[] be able to override the env variables
const TILESDIR = process.env.TILESDIR || "tilesets" // directory to read mbtiles files
const HOST = process.env.HOST || '127.0.0.1' // default listen address
const PORT = process.env.PORT || null
const EXPIRES = process.env.EXPIRES || 864000 //60 * 60 * 24 or 48 hours
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers
const {
  overZoom,
  getZoomFactor
} = require("./lib/overZoom.js")

/*WMTS*/
const wmts = require('wmts')
const {
  mbtilesNotFound,
  // invalidTile,
  tileNotFound,
  invalidVersion,
  invalidService,
  getQuery,
  invalidQuery
} = require('./lib/utils.js')

function build(opts = {}) {
  const app = fastify(opts)
  
  // fastify extensions
  app.register(require('fastify-caching'), {
    privacy: 'private',
    expiresIn: EXPIRES
  })
  app.register(require('fastify-cors'))

  // app.addHook("preHandler", (req, reply, done) => {
  //   app.log.error(req.params)
  //   done()
  // })

  /*--ROUTES--*/

  // MBtiles list
  app.get('/', (request, reply) => {
    const query = (request.query) ? request.query : null;
    const files = fs.readdirSync(TILESDIR);
    const mbtiles = files.filter(f => path.extname(f) === ".mbtiles")
    const layers = mbtiles.map(file => {
      return {
        layer: path.parse(file).name,
        tilejson: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.parse(file).name + "/tilejson"}`,
        WMTS: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.parse(file).name + "/WMTS"}`,
        preview: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.parse(file).name + "/map"}`,
      }
    })
    if (query && (query.f === "html" || query.format === "html" || query.html === "true")) {
      reply.type("html").send(require("./preview/index.html.js")(layers))
    }else{
      reply.send(layers)
    }
  })

  // XYZ Tile
  // app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+)', (request, reply) => {
  //   const database = dbNormalize(request.params.database)
  //   try {
  //     const db = dbConnector(TILESDIR, database)
  //     if (!db) throw new Error("Could not connect to database")
  //     const y = path.parse(request.params.y).name;
  //     const tile = [request.params.z, request.params.x, (1 << request.params.z) - 1 - y];
  //     return dbGetTile(db, tile, reply)
  //   } catch (err) {
  //     return reply.code(404).send()
  //   }
  // })

  // MBtiles tilejson route
  app.get('/:database/tilejson', GetTileJSON)

  /*--WMTS--*/
  // see https://github.com/DenisCarriere/mbtiles-server/blob/master/routes/wmts.js 
  app.get('/WMTS', (req, reply) => reply.redirect('/WMTS/1.0.0'))
  app.get('/WMTS/1.0.0', GetWMTSLayers)
  app.get('/:database/WMTS/1.0.0/WMTSCapabilities.xml', GetCapabilitiesRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0', GetTileKVP)
  app.get('/:database/WMTS', GetCapabilitiesKVP)
  // app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
  app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+)', GetTileRESTful)

  /*--PREVIEW ROUTES--*/
  app.get("/preview", (req, reply) => {
    const html = fs.readFileSync("./preview/index.html", "utf8");
    reply.type("text/html").send(html)
  })

  app.get("/:database/map", (req, reply) => {
    try {
      const database = dbNormalize(req.params.database);
      // app.log.warn("database")
      const db = dbConnector(TILESDIR, database);
      // app.log.warn("db")
      const metadata = dbGetMetadata(db, database)
      // app.log.warn("meta")
      let preview;
      if (metadata.format && ["jpg", "jpeg", "png", "webp"].includes(metadata.format)) {
        preview = require("./preview/leaflet-preview.js");
        reply.type("text/html").send(preview(metadata))
      } else {
        preview = require("./preview/mapbox-preview.js");
        reply.type("text/html").send(preview(metadata))
      }
    } catch (err) {
      app.log.error("Error with map preview: " + err);
      reply.status(500).send(err)
    }
  })

  /**
   * 
   * @param {*} req 
   * @param {Object} reply 
   */
  function GetTileJSON(req, reply) {
    const now = Date.now()
    const database = dbNormalize(req.params.database)
    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      const metadata = dbGetMetadata(db, database)
      if (!metadata) {
        throw new Error("No metadata found.")
      }
      return reply.send(metadata)
    } catch (err) {
      app.log.error("Tilejson Error: " + err)
      return reply.code(404).send(err)
    }
  }

  /**
   * GetWMTSLayers
   * @param {Reqeust} req 
   * @param {Response} reply 
   * @returns 
   */
  function GetWMTSLayers(req, reply) {
    const files = fs.readdirSync(TILESDIR);
    const mbtiles = files.filter(f => path.extname(f) === ".mbtiles")
    // const layer = database.replace(".mbtiles", "")
    return mbtilesListMetadataToXML(mbtiles, reply)
  }

  function mbtilesListMetadataToXML(databases, reply) {
    // return reply.send(databases)
    return mbtilesMedataToXML(databases[3], reply)
  }

  /**
   * GetCapabilities RESTful
   *
   * @param {Request} req
   * @param {Response} reply
   */
  function GetCapabilitiesRESTful(req, reply) {
    const database = dbNormalize(req.params.database);
    const layer = database.replace(".mbtiles", "")
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
    const database = dbNormalize(req.params.database)
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
          return reply.code(404).send(err)
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
    const database = dbNormalize(req.params.database)
    const layer = database.replace(".mbtiles", "")
    // if (!fs.existsSync(path.join(TILESDIR, database))) return mbtilesNotFound(url, layer, filepath, res)
    if (!mercator.validTile(tile)) return invalidTile(url, layer, tile, reply)

    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      return dbGetTile(db, [z, x, (1 << z) - 1 - y], reply)
    } catch (err) {
      app.log.error("GetTileRestful Error: " + err)
      return reply.code(404).send(err)
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
      const stmt = db.prepare(`SELECT name, value FROM metadata where name in ('name', 'attribution','bounds','center', 'description', 'maxzoom', 'minzoom', 'pixel_scale', 'format')`);
      const rows = stmt.all()
      if (!rows) {
        reply.code(204).send('No metadata present')
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
          url: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${database.replace(".mbtiles", "")}/WMTS`,
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
      reply.code(500).send('Error fetching metadata: ' + err + '\n')
    }
  }

  function GetCapabilitiesKVP(req, reply) {
    const db = dbNormalize(req.params.database)
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

  function dbConnector(dir, database) {
    try {
      if (!fs.existsSync(path.join(dir, database))) throw new Error("database does not exist.")
      const connection = new DB(path.join(dir, database), {
        readonly: true,
        fileMustExist: true
      })
      return connection
    } catch (err) {
      app.log.error("dbConnector error: " + err)
      return false
    }
  }

  async function dbGetTile(db, t, reply) {
    const tile = t.map(i => Number(i))

    try {
      //overZoom function, returns a buffer of the overzoomed tile, returns false, or throws error
      //try/catch are in the onverZoom function
      const data = await overZoom(db, tile)
      if (data) {
        reply.header("Content-Length", data.buffer.byteLength)
        reply.header("Content-Type", `image/${data.metadata.format}`)
        reply.header("X-Powered-By", "OverZoom Beta")
        return reply.send(data.buffer)
      }

      const stmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?');
      const row = stmt.get(tile)
      if (!row) {
        app.log.warn("getTileError, no data found: ")
        return reply.code(204).send() //change to sending blank png tile?
      }
      Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
        reply.header(h[0], h[1])
      )
      reply.send(row.tile_data)
    } catch (err) {
      app.log.error("getTileError, unknown: " + err)
      reply.code(500).send(err) //TODO merge these routes with the original WMTS error handlers //TODO check all error status codes
    }
  }

  function dbGetMetadata(db, databaseName) {
    const now = Date.now()
    try {
      const stmt = db.prepare(`SELECT name, value FROM metadata where name in ('name', 'attribution','bounds','center', 'description', 'maxzoom', 'minzoom', 'pixel_scale', 'format', 'json')`);
      const rows = stmt.all()
      if (!rows) {
        return null
      }
      const metadata = {};
      let format, name;
      rows.forEach(r => {
        if (r.name === "format") {
          format = (r.value === "jpg") ? "jpeg" : r.value
          r.value = format
        }
        if (r.name === "name") name = r.value
        let value = (isNaN(r.value)) ? r.value : Number(r.value);
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
      metadata["maxNativeZoom"] = metadata.maxzoom
      metadata.maxzoom = metadata.maxzoom + getZoomFactor(format)
      metadata["scheme"] = "xyz"
      metadata["tilejson"] = "2.1.0"
      metadata["type"] = "overlay"
      metadata["version"] = "1.1"
      metadata["tiles"] = [
        `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${databaseName.replace(".mbtiles", "")}/{z}/{x}/{y}${(format) ? "." + format : ""}`
      ]
      /**
       * CUSTOM METADATA
       * */
      metadata["filename"] = path.parse(databaseName).name
      metadata["WMTS"] = `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.parse(databaseName).name + "/WMTS"}`
      metadata["date_accessed"] = timestamp()
      metadata["debug"] = "Fetched in " + (Date.now() - now) + "ms."
      //NOTE attempt to populate missing format value from the buffer type using tiletype
      if (!metadata.format) {
        const row = db.prepare('Select * from tiles').get();
        if (row) {
          Object.entries(tiletype.headers(row.tile_data)).forEach(h => {
            if (h[0] === "Content-Type") metadata["format"] = h[1].split("/")[1]
          })
        }
        metadata.format = (metadata.format === "jpg") ? "jpeg" : metadata.format
      }

      return metadata

    } catch (err) {
      app.log.error("getMetadata error: " + err)
      throw new Error("metadata error")
    }
  }

  function dbNormalize(name) {
    return path.extname(name) === '.mbtiles' ? name : name + '.mbtiles';
  }

  function timestamp() {
    const date = new Date(Date.now())
    return ((date.getMonth() + 1) / 100 + date.toUTCString() + date / 1e3).replace(/..(..).+?(\d+)\D+(\d+).(\S+).*(...)/, '$3-$1-$2T$4.$5Z');
  }
  /*--END HELPERS */

  return app

}

module.exports = build