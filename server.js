require('dotenv').config()
const LOCAL_HOST = process.env.LOCAL_HOST || 'localhost'
const LOCAL_PORT = process.env.LOCAL_PORT || 3000 // PORT the server runs on
const LOG_LEVEL = process.env.LOG_LEVEL || "warn"
const server = require("./app")({
  logger: {
    enable: true,
    prettyPrint: true,
    level: LOG_LEVEL
  },
  ignoreTrailingSlash: true,
  keepAliveTimeout: process.env.KEEPALIVE || 1000*60*60*2
})

server.listen(LOCAL_PORT, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})
console.log(`tile server listening on PORT http://${LOCAL_HOST}:${LOCAL_PORT}`)