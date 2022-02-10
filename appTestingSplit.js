require('dotenv').config()
const crypto = require("crypto");
const DB = require("better-sqlite3")
const fs = require("fs")
const fastify = require('fastify')
const mercator = require("global-mercator")
const path = require('path')
const tiletype = require('@mapbox/tiletype')
const wmts = require('wmts')

const TILESDIR = process.env.TILESDIR || "tilesets" // directory to read mbtiles files
const HOST = process.env.HOST || '127.0.0.1' // default listen address
const PORT = process.env.PORT || null
const EXPIRES = process.env.EXPIRES || 432000 //60 * 60 * 24 or 48 hours
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers
const KEYS = process.env.KEYS && process.env.KEYS.includes(",") ? process.env.KEYS.split(",") : process.env.KEYS ? [process.env.KEYS] : null;
const COOKIENAME = process.env.COOKIE_NAME || "wmtsServerKey"

// Task List
//TODO split out raster server
//TODO split out pbf server minimal setup like mbtiles server tobin bradley or mbview
//TODO add sequalize feature server

const {
  overZoom,
  getZoomFactor
} = require("./lib/overZoom.js")

/*WMTS*/
const {
  mbtilesNotFound,
  // invalidTile,
  tileNotFound,
  invalidVersion,
  invalidService,
  getQuery,
  invalidQuery
} = require('./lib/utils.js')

function service(opts = {}) {
  const app = fastify(opts)
  .register(require('fastify-caching'), {
    privacy: 'private',
    expiresIn: EXPIRES
  })
  .register(require('fastify-cors'))
  .register(require('fastify-static'), {
    root: path.join(__dirname, 'static')
  })
  .register(require('fastify-jwt'), {
    secret: process.env.SECRET || crypto.randomBytes(20).toString('hex'),
    cookie: {
      cookieName: COOKIENAME,
      signed: false
    }
  })
  .register(require('fastify-cookie'))

  if (KEYS) {
    app.register(require("./lib/secureRoutes"), {
      keys: KEYS,
      cookieName: COOKIENAME,
      expires: EXPIRES
    })
  }

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
    if (query && (query.f === "json" || query.format === "json" || query.json === "true")) {
      reply.send(layers)
    }else{
      reply.type("html").send(require("./templates/index.js")(layers))
    }
  })

  /*--PREVIEW ROUTES--*/
  app.get("/:database/map", (req, reply) => {
    try {
      const database = dbNormalize(req.params.database);
      const db = dbConnector(TILESDIR, database);
      const metadata = dbGetMetadata(db, database)
      let preview;
      if (metadata.format && ["jpg", "jpeg", "png", "webp"].includes(metadata.format.toLowerCase())) {
        preview = require("./templates/leaflet-preview.js");
        reply.type("text/html").send(preview(metadata))
      } else if (metadata.format && ["pbf", "mvt"].includes(metadata.format.toLowerCase())) {
        preview = require("./templates/mapbox-preview.js");
        reply.type("text/html").send(preview(metadata))
      } else {
        reply.status(404).send({error: "Not Found"})
      }
    } catch (err) {
      app.log.error("Error with map preview: " + err);
      reply.status(500).send(err)
    }
  })

  //TODO separate these routes, use env variables with default set to all routes, but able to specify vector-tiles, rasters, features
  //use fastify plugins for each route type

  const routes = process.env.ROUTES && process.env.ROUTES.includes(",") ? process.env.routes.split(",") : process.env.ROUTES ? [process.env.ROUTES] : ["features", "rasters", "vectors"]

  // MBtiles tilejson route
  app.get('/:database/tilejson', GetTileJSON)

  routes.forEach(r => {
    if (fs.existsSync("./src/routes/" + r + ".js")) app.register(require("./src/routes/" + r), {
      tiles: TILESDIR
    })
  })

  /**
   * 
   * @param {*} req 
   * @param {Object} reply 
   */
  function GetTileJSON(req, reply) {
    const database = dbNormalize(req.params.database)
    try {
      const db = dbConnector(TILESDIR, database)
      if (!db) throw new Error("Could not connect to database")
      const metadata = dbGetMetadata(db, database)
      if (!metadata) throw new Error("No metadata found.")
      return reply.send(metadata)
    } catch (err) {
      app.log.error("Tilejson Error: " + err)
      return reply.code(404).send(err)
    }
  }

  function dbConnector(dir, database) {
    try {
      if (!fs.existsSync(path.join(dir, database))) throw new Error("database does not exist.")
      const connection = new DB(path.join(dir, database), {
        readonly: true
      })
      return connection
    } catch (err) {
      app.log.error("dbConnector error: " + err)
      return false
    }
  }

  function dbNormalize(name) {
    return path.extname(name) === '.mbtiles' ? name : name + '.mbtiles';
  }

  function timestamp() {
    const date = new Date(Date.now())
    return ((date.getMonth() + 1) / 100 + date.toUTCString() + date / 1e3).replace(/..(..).+?(\d+)\D+(\d+).(\S+).*(...)/, '$3-$1-$2T$4.$5Z');
  }

  return app

}

module.exports = service