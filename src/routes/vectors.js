const fp = require("fastify-plugin");
const path = require("path");

module.exports = fp(function(app, options, done) {
  app.get('/:name/:z/:x/:y', (request, reply) => {
    const database = path.extname(req.params.name) === '.mbtiles' ? req.params.name : req.params.name + '.mbtiles';
    const y = path.parse(request.params.y).name
    const db = dbConnector(options.tiles, database);
    const row = db.prepare(`SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?`)
                  .get(request.params.z, request.params.x, (1 << request.params.z) - 1 - y)
  
    if (!row) {
      reply.code(204).send()
    } else {
      Object.entries(tiletype.headers(row.tile_data)).forEach(h =>
        reply.header(h[0], h[1])
      )
      reply.send(row.tile_data)
    }
  })
  done()
})