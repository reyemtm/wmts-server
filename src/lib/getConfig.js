const { parsed } = require("dotenv").config();
const defaults = {
  SITE_TITLE: "WMTS Server",
  SITE_AUTHOR: "Malcolm Meyer",
  SITE_ABOUT: "A WMTS mbtiles server written in NodeJS to power interactive web maps.",
  SITE_AUTHOR_URL: "https://getbounds.com",
  SITE_AUTHOR_URL_NAME: "getBounds"
}
module.exports = (opts) => {
  return Object.assign(defaults, parsed, opts)
}