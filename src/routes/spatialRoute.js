const { dbConnector, GetTileJSON } = require("../lib/dbConnector");
const tilequery = require("tilequery");

module.exports = function(app, options, done) {

  const { TILESDIR, LOCALHOST, HOST, PORT, PROTOCOL } = options;

  app.get('/:database/query', async (request, reply) => {
    const database = request.params.database; 

    try {

      const defaults = {
        lng: -82.66,
        lat: 39.74,
        units: 'miles',
        buffer: true,
        radius: 0.5
      }

      const requestQuery = (request.query) ? request.query : null;

      const query = Object.assign(defaults, requestQuery);
      console.log(query)
      const tilejson = GetTileJSON(TILESDIR, database);
  
      const now = Date.now()
      const features = await tilequery({
        point: [Number(query.lng), Number(query.lat)], 
        radius: Number(query.radius),
        units: query.units,
        tiles: `http://${LOCALHOST}:${PORT}/${database}/{z}/{x}/{y}.pbf`,
        layer: tilejson.vector_layers[0].id,
        zoom: tilejson.maxzoom < 14 ? tilejson.maxzoom : 14,
        buffer: query.buffer
      });
    
      console.log("timer:", Date.now() - now, "ms")
      console.log("features found:", features.features.length)
      reply.send(features)
    }catch(err) {
      reply.status(404).send({error: "database does not exist"})
    }
  })
  
  done()

}