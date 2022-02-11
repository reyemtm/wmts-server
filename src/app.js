require('dotenv').config()
const fastify = require('fastify')
const path = require('path')
const EXPIRES = process.env.EXPIRES || 432000 //60 * 60 * 24 or 48 hours
const { existsSync } = require("fs")
const COOKIENAME = process.env.COOKIE_NAME || "wmtsServerKey"
const HOST = process.env.HOST || '127.0.0.1' // default listen address
const LOCALHOST = process.env.LOCALHOST || '127.0.0.1'
const PORT = process.env.PORT || null
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers
const TILESDIR = process.env.TILESDIR || "tilesets" // directory to read mbtiles files



const KEYS = (existsSync("./keys.json")) ? require("../keys.json") : null;

const config = {
  COOKIENAME: COOKIENAME,
  KEYS: KEYS,
  TILESDIR: TILESDIR,
  HOST: HOST,
  PORT: PORT,
  PROTOCOL: PROTOCOL,
  LOCALHOST: LOCALHOST 
}

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
  .register(require("./routes/publicRoutes"), config)
  .register(require("./routes/secureRoutes"), config)
  // .register(require("./routes/spatialRoute"), config)

  return app

}

module.exports = service