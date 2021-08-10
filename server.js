require('dotenv').config()
const LOCAL_HOST = process.env.LOCAL_HOST || 'localhost'
const LOCAL_PORT = process.env.LOCAL_PORT || 3000 // PORT the server runs on

const server = require("./app")({
  logger: {
    enable: false,
    prettyPrint: true,
    level: "error"
  },
  ignoreTrailingSlash: true,
  keepAliveTimeout: process.env.KEEPALIVE || 7200
})

server.listen(LOCAL_PORT, (err) => {
  if (err) {
    console.log(err)
    process.exit(1)
  }
})
console.log(`tile server listening on PORT http://${LOCAL_HOST}:${LOCAL_PORT}`)