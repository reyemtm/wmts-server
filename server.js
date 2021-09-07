require('dotenv').config()
const LOCAL_HOST = process.env.LOCAL_HOST || '0.0.0.0'
const LOCAL_PORT = process.env.LOCAL_PORT || 3000 // PORT the server runs on
const LOG_LEVEL = process.env.LOG_LEVEL || "error"
const HOST = process.env.HOST || "localhost"

const server = require("./app")({
  logger: {
    enable: true,
    prettyPrint: true,
    level: LOG_LEVEL
  },
  ignoreTrailingSlash: true,
  keepAliveTimeout: process.env.KEEPALIVE || 1000*60*60*2
})

server.listen(LOCAL_PORT, LOCAL_HOST, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})

console.log(`tile server listening on PORT http://${HOST}:${LOCAL_PORT}`)