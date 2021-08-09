require('dotenv').config()
const fs = require("fs")
const fastify = require('fastify')({
  logger: {
    enable: true,
    prettyPrint: true,
    level: "error"
  },
  ignoreTrailingSlash: true,
  keepAliveTimeout: process.env.KEEPALIVE || 60000
});
const tiletype = require('@mapbox/tiletype')
const path = require('path')
const DB = require("better-sqlite3")

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

// fastify extensions
fastify.register(require('fastify-caching'), {
  privacy: 'private',
  expiresIn: EXPIRES
})
fastify.register(require('fastify-cors'))

// fastify.addHook("preHandler", (req, reply, done) => {
//   fastify.log.error(req.params)
//   done()
// })

/*--ROUTES--*/

// MBtiles list
fastify.get('/', (request, reply) => {
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
fastify.get('/:database/:z/:x/:y', (request, reply) => {
  const database = dbNormalize(request.params.database)
  try {
    const db = dbConnector(TILESDIR, database)
    if (!db) throw new Error("Could not connect to database")
    const y = path.parse(request.params.y).name
    const tile = [request.params.z, request.params.x, (1 << request.params.z) - 1 - y];
    return dbGetTile(db, tile, reply)
  }catch(err) {
    return reply.code(404).send()
  }
})

// MBtiles meta route
fastify.get('/:database/tilejson', (request, reply) => {
  //TODO make this actual tilejson spec
  const database = dbNormalize(request.params.database)
  try {
    const db = dbConnector(TILESDIR, database)
    if (!db) throw new Error("Could not connect to database")
    return dbGetMetadata(db, reply)
  }catch(err) {
    return reply.code(404).send(err)
  }
})

/*--WMTS--*/
/* see https://github.com/DenisCarriere/mbtiles-server/blob/master/routes/wmts.js */

fastify.get('/:database/WMTS/1.0.0/WMTSCapabilities.xml', GetCapabilitiesRESTful)
fastify.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+)', GetTileRESTful)
fastify.get('/:database/WMTS/tile/1.0.0/:database/:Style/:TileMatrixSet/:z(\\d+)/:y(\\d+)/:x(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)
fastify.get('/:database/WMTS/tile/1.0.0', GetTileKVP)
fastify.get('/:database/WMTS', GetCapabilitiesKVP)
fastify.get('/:database/:z(\\d+)/:x(\\d+)/:y(\\d+):ext(.jpg|.png|.jpeg|.pbf|)', GetTileRESTful)

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
        const y = path.parse(request.params.y).name
        (1 << z) - 1 - y
        return dbGetTile(db, [z,x,(1 << z) - 1 - y], reply)
      }catch(err) {
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
    return dbGetTile(db, [z,x,(1 << z) - 1 - y], reply)
  }catch(err) {
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
      rows.forEach((r,i) => {
        let value = (isNaN(r.value)) ? r.value : Number(r.value)
        if (r.value.split(",").length > 1) {
          const array = r.value.split(",")
          value = array.reduce((i,v) => [...i, Number(v)], [])
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
  }catch(err) {
    if (err) {
      reply.code(500).send('Error fetching metadata: ' + err + '\n')
    }
  }
}

/*--END WMTS--*/

// Run the server!
fastify.listen(LOCAL_PORT, LOCAL_HOST)
console.log(`tile server listening on PORT http://${LOCAL_HOST}:${LOCAL_PORT}`)

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

function dbGetTile(db, tile, reply) {
  fastify.log.error(tile)
  try {
    const stmt = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?');
    const row = stmt.get(tile)
    if (row) {
      Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
        reply.header(h[0], h[1])
      )
      reply.send(row.tile_data)
    } else {
      reply.code(400).send({Error: "tile not found"}) //change to sending blank png tile?
    }
  } catch (err) {
    if (err) {
      reply.code(500).send(err) //TODO merge these routes with the original WMTS error handlers
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
      rows.forEach((r,i) => {
        metadata[r.name] = r.value
      })
      reply.send(metadata)
    }
  }catch(err) {
    reply.code(404).send(err)
  }
}

function dbNormalize(name) {
  return path.extname(name) === '.mbtiles' ? name : name + '.mbtiles';
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

/*--END HELPERS */