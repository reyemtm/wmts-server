require("dotenv").config;
const fs = require("fs");
const path  = require("path")
const crypto = require("crypto");
const DIR = process.env.TILESDIR || "./src/tilesets";

const files = fs.readdirSync(DIR);
const dbFiles = files.filter(f => [".mbtiles", ".sqlite"].indexOf(path.extname(f)) > -1)
const keys = [];
dbFiles.forEach(f => {
  keys.push({
    file: f.replace(".mbtiles", "").replace(".sqlite", ""),
    keys: ["127.0.0.1:3000",crypto.randomBytes(20).toString('hex')],
    type: path.extname(f)
  })
})
if (fs.existsSync("./keys.json")) {
  throw new Error("\n\nkeys.json already exists! Please delete before creating a new keys file.\n\n")
}else{
  fs.writeFileSync("./keys.json", JSON.stringify(keys,0,2))
}