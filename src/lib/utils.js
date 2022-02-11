/**
 * MBTiles not found
 *
 * @param {string} url
 * @param {string} layer
 * @param {string} filepath
 * @param {Response} reply
 */
 function mbtilesNotFound (url, layer, filepath, reply) {
  return reply.status(404).send({
    url,
    layer,
    filepath,
    ok: false,
    status: 404,
    statusText: 'layer not found'
  })
}

/**
 * Invalid Tile
 *
 * @param {string} url
 * @param {string} layer
 * @param {[number, number, number]} tile
 * @param {Response} reply
 */
function invalidTile (url, layer, tile, reply) {
  return reply.status(400).send({
    url,
    layer,
    tile,
    ok: false,
    status: 400,
    statusText: 'invalid tile'
  })
}

/**
 * Invalid Version
 *
 * @param {string} url
 * @param {string} layer
 * @param {string} filepath
 * @param {Response} reply
 */
function invalidVersion (url, layer, filepath, reply) {
  return reply.status(400).send({
    url,
    layer,
    filepath,
    ok: false,
    status: 400,
    statusText: 'version must be 1.0.0'
  })
}

/**
 * Invalid Service
 *
 * @param {string} url
 * @param {string} layer
 * @param {string} filepath
 * @param {string} [service='wmts']
 * @param {Response} reply
 */
function invalidService (url, layer, filepath, service = 'wmts', reply) {
  return reply.status(400).send({
    url,
    layer,
    filepath,
    ok: false,
    status: 400,
    statusText: 'service must be ' + service
  })
}

/**
 * Invalid Service
 *
 * @param {string} url
 * @param {string} layer
 * @param {string} filepath
 * @param {string} query
 * @param {Response} reply
 */
function invalidQuery (url, layer, filepath, query, reply) {
  return reply.status(400).send({
    url,
    layer,
    filepath,
    ok: false,
    status: 400,
    statusText: 'invalid query ' + query
  })
}

/**
 * Tile not found
 *
 * @param {string} url
 * @param {string} layer
 * @param {[number, number, number]} tile
 * @param {Response} reply
 */
function tileNotFound (url, layer, tile, reply) {
  return reply.status(404).send({
    url,
    layer,
    tile,
    ok: false,
    status: 404,
    statusText: 'tile not found'
  })
}

/**
 * Extract Query from URL Request
 *
 * @param {Request} req Request
 * @returns {Object}
 */
function getQuery (req) {
  const query = {}
  Object.keys(req.query).forEach(key => {
    query[key.toLowerCase()] = req.query[key].toLowerCase()
  })
  return query
}

module.exports = {
  invalidQuery,
  getQuery,
  mbtilesNotFound,
  invalidTile,
  tileNotFound,
  invalidVersion,
  invalidService
}