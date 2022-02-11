const fs = require("fs");
const path = require("path");

module.exports = function(app, options, done) {

  const { TILESDIR, HOST, PORT, PROTOCOL } = options;

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