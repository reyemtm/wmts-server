require('dotenv').config()
const fs = require("fs");
const path = require("path");

const TILESDIR = process.env.TILESDIR || "tilesets" // directory to read mbtiles files
const HOST = process.env.HOST || '127.0.0.1' // default listen address
const PORT = process.env.PORT || null
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers

module.exports = function(app, _, done) {
  app.get('/', (request, reply) => {
    const query = (request.query) ? request.query : null;
    const files = fs.readdirSync(TILESDIR);
    const mbtiles = files.filter(f => path.extname(f) === ".mbtiles")
    const layers = mbtiles.map(file => {
      return {
        layer: path.parse(file).name,
        tilejson: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${path.parse(file).name + "/tilejson"}`,
        WMTS: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${path.parse(file).name + "/WMTS"}`,
        preview: `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${path.parse(file).name + "/map"}`,
      }
    })
    if (query && (query.f === "json" || query.format === "json" || query.json === "true")) {
      reply.send(layers)
    } else {
      reply.type("html").send(require("../templates/index.js")(layers))
    }
  })

  done()

}