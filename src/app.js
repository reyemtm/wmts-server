require('dotenv').config()
const fastify = require('fastify')
const path = require('path')
const EXPIRES = process.env.EXPIRES || 432000 //60 * 60 * 24 or 48 hours

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

  .register(require("./routes/publicRoutes"))
  .register(require("./routes/secureRoutes"))

  return app

}

module.exports = service