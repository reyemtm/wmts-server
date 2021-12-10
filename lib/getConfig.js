const { parsed } = require("dotenv").config();
const defaults = {
  SITE_TITLE: "WMTS Server",
  SITE_AUTHOR: "Malcolm Meyer",
  SITE_ABOUT: "A WMTS Server written in NodeJS to power interactive web maps."
}

module.exports = (opts) => {
  return Object.assign(defaults, parsed, opts)
}