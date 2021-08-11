require('dotenv').config()
const fs = require("fs")
const fastify = require('fastify')
const tiletype = require('@mapbox/tiletype')
const path = require('path')
const DB = require("better-sqlite3")
const tilebelt = require("@mapbox/tilebelt")
const sharp = require("sharp")
/*CONFIG*/
const TILESDIR = process.env.TILESDIR || "data" // directory to read mbtiles files
const HOST = process.env.HOST || 'localhost' // default listen address
const LOCAL_HOST = process.env.LOCAL_HOST || 'localhost'
const PORT = process.env.PORT || null
const LOCAL_PORT = process.env.LOCAL_PORT || 3000 // PORT the server runs on
const EXPIRES = process.env.EXPIRES || 864000 //60 * 60 * 24 or 48 hours
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers

/*WMTS*/
const wmts = require('wmts')
// const mercator = require('global-mercator')
const {
  mbtilesNotFound,
  // invalidTile,
  tileNotFound,
  invalidVersion,
  invalidService,
  getQuery,
  invalidQuery
} = require('./lib/utils.js')
const {
  format
} = require('path')

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
    const files = fs.readdirSync(TILESDIR);
    const mbtiles = files.filter(f => path.extname(f) === ".mbtiles")
    reply.send(mbtiles.map(file => {
      return {
        layer: file,
        tilejson: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.basename(file) + "/tilejson"}`,
        WMTS: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${path.basename(file) + "/WMTS"}`
      }
    }))
  })

  // XYZ Tile
  app.get('/:database/:z/:x/:y', (request, reply) => {
    const database = dbNormalize(request.params.database)
    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      const y = path.parse(request.params.y).name;
      const tile = [request.params.z, request.params.x, (1 << request.params.z) - 1 - y];
      return dbGetTile(db, tile, reply)
    } catch (err) {
      return reply.code(404).send()
    }
  })

  // MBtiles meta route
  app.get('/:database/tilejson', (request, reply) => {
    const database = dbNormalize(request.params.database)
    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      return dbGetMetadata(db, reply)
    } catch (err) {
      return reply.code(404).send(err)
    }
  })

  //--WMTS--
  // see https://github.com/DenisCarriere/mbtiles-server/blob/master/routes/wmts.js 

  app.get('/:database/WMTS/1.0.0/WMTSCapabilities.xml', GetCapabilitiesRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
  app.get('/:database/WMTS/tile/1.0.0', GetTileKVP)
  app.get('/:database/WMTS', GetCapabilitiesKVP)
  app.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)

  //
  //TODO turn this into a preview route from the tilejson
  app.get("/preview", (req, reply) => {
    const html = fs.readFileSync("./preview/index.html", "utf8");
    reply.type("text/html").send(html)
  })

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
        // if (!mercator.validTile(tile)) return invalidTile(url, layer, tile, reply)

        try {
          const db = dbConnector(TILESDIR, database)
          if (!db) throw new Error("Could not connect to database")
          const y = path.parse(request.params.y).name(1 << z) - 1 - y
          return dbGetTile(db, [z, x, (1 << z) - 1 - y], reply)
        } catch (err) {
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
    const x = Number(req.params.x || req.query.TILECOL)
    const y = Number(req.params.y || req.query.TILEROW)
    const z = Number(req.params.z || req.query.TILEMATRIX)
    const tile = [x, y, z]
    const url = req.url
    const database = dbNormalize(req.params.database)
    const layer = database.replace(".mbtiles", "")
    if (!fs.existsSync(path.join(TILESDIR, database))) return mbtilesNotFound(url, layer, filepath, res)
    // if (!mercator.validTile(tile)) return invalidTile(url, layer, tile, reply)

    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      return dbGetTile(db, [z, x, (1 << z) - 1 - y], reply)
    } catch (err) {
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
          metadata[r.name] = value
        })
        const xml = wmts({
          url: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${database.replace(".mbtiles", "")}/WMTS`,
          title: metadata.name,
          minzoom: metadata.minzoom,
          maxzoom: metadata.maxzoom,
          abstract: metadata.description,
          bbox: metadata.bounds,
          format: metadata.format,
          spaces: 2
        })
        reply.type('text/xml');
        return reply.send(xml)
      }
    } catch (err) {
      if (err) {
        reply.code(500).send('Error fetching metadata: ' + err + '\n')
      }
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
      if (!fs.existsSync(path.join(dir, database))) throw new Error("database dooes not exist.")
      const connection = new DB(path.join(dir, database), {
        readonly: true,
        fileMustExist: true
      })
      return connection
    } catch (err) {
      if (err) return false
    }
  }

  class OverZoom {
    constructor() {}
    GetParentTile = (tile) => {
      const bbox = globalMercator.tileToBBox([tile[1], tile[2], tile[0]]);
      const center = globalMercator.bboxToCenter(bbox);
      const parentTile = globalMercator.pointToTile(center, tile[0] - 1)
      return parentTile
    }
    ExpandTile = (parentTile) => {
      return expandedTile
    }
    EnhanceTile = (exapndedTile) => {
      return enhancedTile
    }
    SplitTile = (enhancedTile) => {
      return splitTile
    }
    ToTile = (tile) => {
      return [tile[2], tile[0], tile[1]]
    }
  }

  const overZoom = new OverZoom()

  function dbGetTile(db, t, reply) {
    const tile = [Number(t[0]), Number(t[1]), Number(t[2])]

    //TODO make this a fn of max zoom native maxzoom
    if (tile[0] > 20) {
      try {
        const getMaxZoom = db.prepare(`SELECT name, value FROM metadata where name = 'maxzoom'`);
        const maxzoom = getMaxZoom.all();
        if (maxzoom && maxzoom[0].value && Number(maxzoom[0].value) >= 19) {
          const z = Number(maxzoom[0].value)
          app.log.warn(maxzoom[0].value)
          const zF = tile[0] - z;
          if (zF < 3) {

            app.log.warn("Attempting enable overzoom: " + zF)
            const tileClipMatrix = [{
              left: 0,
              top: 256
            }, {
              left: 256,
              top: 256
            }, {
              left: 256,
              top: 0
            }, {
              left: 0,
              top: 0
            }]
            const originTile = (tile[0] == 21) ?
              tilebelt.getParent([tile[1], tile[2], tile[0]]) :
              tilebelt.getParent(tilebelt.getParent([tile[1], tile[2], tile[0]]))

            //works for first order children
            //children of parent of the requested tile
            const children = tilebelt.getChildren(tilebelt.getParent([tile[1], tile[2], tile[0]]))
            const child = [];
            children.forEach((c, i) => {
              const ct = overZoom.ToTile(c)
              if (ct[1] === tile[1] && ct[2] === tile[2]) child.push(i)
            });

            let _child = 0,
              requestedParentTile, requestedParentSiblings;
            if (tile[0] == 22) {
              //parent of the child that we need from above
              requestedParentTile = tilebelt.getParent([tile[1], tile[2], tile[0]]);

              //siblings of the requestedParentTile
              requestedParentSiblings = tilebelt.getSiblings(requestedParentTile);

              //child of requestedParentTile that we need to split in oder to get the actual tile that is being requested
              requestedParentSiblings.forEach((c, i) => {
                const ct = overZoom.ToTile(c)
                const rpt = overZoom.ToTile(requestedParentTile)
                if (ct[1] === rpt[1] && ct[2] === rpt[2]) _child = i
              });
            }

            try {
              const parentTileStmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?');
              const row = parentTileStmt.get(overZoom.ToTile(originTile))
              if (row) {
                if (tile[0] == 21) {
                  return sharp(row.tile_data)
                    .resize(512, 512, {
                      kernel: sharp.kernel.lanczos3
                    })
                    // .sharpen(1)
                    .toBuffer()
                    .then(data => {
                      return sharp(data)
                        .extract({
                          left: tileClipMatrix[child].left,
                          top: tileClipMatrix[child].top,
                          width: 256,
                          height: 256
                        })
                        .grayscale()
                        .toBuffer()
                        .then(childData => {
                          Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
                            reply.header(h[0], h[1])
                          )
                          reply.header("X-Powered-By", "OverZoom Beta")
                          reply.send(childData)
                        })
                    })
                    .catch(err => {
                      app.log.error(err)
                      reply.code(204).send()
                    })
                } else if (tile[0] == 22) {
                  return sharp(row.tile_data)
                    .resize(512, 512, {
                      kernel: sharp.kernel.lanczos3
                    })
                    .extract({
                      left: tileClipMatrix[_child].left,
                      top: tileClipMatrix[_child].top,
                      width: 256,
                      height: 256
                    })
                    .toBuffer()
                    .then(data => {
                      // Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
                      //   reply.header(h[0], h[1])
                      // )
                      // return reply.send(data)
                      return sharp(data)
                        .resize(512, 512, {
                          kernel: sharp.kernel.lanczos3
                        })
                        .extract({
                          left: tileClipMatrix[child].left,
                          top: tileClipMatrix[child].top,
                          width: 256,
                          height: 256
                        })
                        .toBuffer()
                        .then(childData => {
                          Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
                            reply.header(h[0], h[1])
                          )
                          reply.header("X-Powered-By", "OverZoom Beta")
                          reply.send(childData)
                        })
                    })
                    .catch(err => {
                      app.log.error(err)
                      reply.code(204).send()
                    })
                }
              } else {
                app.log.error("Error fetching parent tile")
                return reply.code(500).send()
              }
            } catch (err) {
              app.log.error(err)
              return reply.code(204).send()
            }
            //overzoom.ExpandTile
            //overzoom.EnhanceTile
            //overzoom.SplitTile
          }
        }
      } catch (err) {
        app.log.error(err)
        return reply.code(204).send()
      }
    }
    try {
      const stmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?');
      const row = stmt.get(tile)
      if (row) {
        Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
          reply.header(h[0], h[1])
        )
        reply.send(row.tile_data)
      } else {
        reply.code(400).send({
          Error: "tile not found"
        }) //change to sending blank png tile?
      }
    } catch (err) {
      if (err) {
        reply.code(500).send(err) //TODO merge these routes with the original WMTS error handlers //TODO check all error status codes
      }
    }
  }

  function dbGetMetadata(db, reply) {
    try {
      const stmt = db.prepare(`SELECT name, value FROM metadata where name in ('name', 'attribution','bounds','center', 'description', 'maxzoom', 'minzoom', 'pixel_scale', 'format')`);
      const rows = stmt.all()
      if (!rows) {
        reply.code(204).send('No metadata present')
      } else {
        const metadata = {};
        let format, name;
        rows.forEach(r => {
          if (r.name === "format") format = r.value
          if (r.name === "name") name = r.value
          let value = (isNaN(r.value)) ? r.value : Number(r.value);
          if (r.value.split(",").length > 1) {
            const array = r.value.split(",")
            value = array.reduce((i, v) => [...i, Number(v)], [])
          }
          metadata[r.name] = value
        })
        metadata.maxzoom = metadata.maxzoom + 1
        metadata["scheme"] = "xyz"
        metadata["tilejson"] = "2.1.0"
        metadata["type"] = "overlay"
        metadata["version"] = "1.1"
        metadata["tiles"] = [
          `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}`:""}/${name}/{z}/{x}/{y}.${format}`
        ]
        reply.send(metadata)
      }
    } catch (err) {
      reply.code(404).send(err)
    }
  }

  function dbNormalize(name) {
    return path.extname(name) === '.mbtiles' ? name : name + '.mbtiles';
  }

  /*--END HELPERS */

  return app

}

module.exports = build