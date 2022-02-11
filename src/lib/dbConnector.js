require("dotenv").config()
const fs = require("fs");
const path = require("path");
const DB = require("better-sqlite3");
const { getZoomFactor } = require("./overZoom.js")

const HOST = process.env.HOST || '127.0.0.1' // default listen address
const PORT = process.env.PORT || null
const PROTOCOL = process.env.PROTOCOL || "http" //TODO pull this from the proxied http headers

const dbConnector = (dir, database) => {
  const db = path.extname(database) === '.mbtiles' ? database : database + '.mbtiles';
  try {
    if (!fs.existsSync(path.join(dir, db))) throw new Error("database does not exist.")
    const connection = new DB(path.join(dir, db), {
      readonly: true
    })
    return connection
  } catch (err) {
    console.log("dbConnector error: " + err)
    throw new Error(err)
  }
}

/**
 * 
 * @param {*} req 
 * @param {Object} reply 
 */
const GetTileJSON = (dir, database) => {
  try {
    const db = dbConnector(dir, database)
    if (!db) throw new Error("Could not connect to database")
    const metadata = dbGetMetadata(db, database)
    if (!metadata) throw new Error("No metadata found.")
    return metadata
  } catch (err) {
    return {error: err}
  }
}

const dbGetMetadata = (db, databaseName) => {
  const now = Date.now()
  try {
    const stmt = db.prepare(`SELECT name, value FROM metadata where name in ('name', 'attribution','bounds','center', 'description', 'maxzoom', 'minzoom', 'pixel_scale', 'format', 'json')`);
    const rows = stmt.all()
    if (!rows) {
      return null
    }
    const metadata = {};
    let format, name;
    rows.forEach(r => {
      if (r.name === "format") {
        format = (r.value === "jpg") ? "jpeg" : r.value
        r.value = format
      }
      if (r.name === "name") name = r.value
      let value = (isNaN(r.value)) ? r.value : Number(r.value);
      if (r.value.split(",").length > 1) {
        const array = r.value.split(",")
        value = array.reduce((i, v) => [...i, Number(v)], [])
      }
      if (r.name === "json" && r.value) {
        const json = JSON.parse(r.value)
        r.name = "vector_layers"
        value = json["vector_layers"]
      }
      metadata[r.name] = value
    })
    metadata["maxNativeZoom"] = metadata.maxzoom
    metadata.maxzoom = metadata.maxzoom + getZoomFactor(format)
    metadata["scheme"] = "xyz"
    metadata["tilejson"] = "2.1.0"
    metadata["type"] = "overlay"
    metadata["version"] = "1.1"
    metadata["tiles"] = [
      `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${databaseName.replace(".mbtiles", "")}/{z}/{x}/{y}${(format) ? "." + format : ""}`
    ]
    /**
     * CUSTOM METADATA
     * */
    metadata["filename"] = path.parse(databaseName).name
    metadata["WMTS"] = `${PROTOCOL}://${HOST}${(PORT) ? `:${PORT}` : ""}/${path.parse(databaseName).name + "/WMTS"}`
    metadata["date_accessed"] = timestamp()
    metadata["debug"] = "Fetched in " + (Date.now() - now) + "ms."
    //NOTE attempt to populate missing format value from the buffer type using tiletype
    if (!metadata.format) {
      const row = db.prepare('Select * from tiles').get();
      if (row) {
        Object.entries(tiletype.headers(row.tile_data)).forEach(h => {
          if (h[0] === "Content-Type") metadata["format"] = h[1].split("/")[1]
        })
      }
      metadata.format = (metadata.format === "jpg") ? "jpeg" : metadata.format
    }

    return metadata

  } catch (err) {
    throw new Error("metadata error")
  }
}

function timestamp() {
  const date = new Date(Date.now())
  return ((date.getMonth() + 1) / 100 + date.toUTCString() + date / 1e3).replace(/..(..).+?(\d+)\D+(\d+).(\S+).*(...)/, '$3-$1-$2T$4.$5Z');
}

module.exports = {
  GetTileJSON: GetTileJSON,
  dbConnector: dbConnector,
  dbGetMetadata: dbGetMetadata
}