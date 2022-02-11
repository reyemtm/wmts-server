'use strict'
require("dotenv").config

const { test } = require('tap')
const build = require('./src/app');
const fs = require("fs");
const path = require("path");

const TILESDIR = process.env.TILESDIR || "./src/tilesets";
const files = fs.readdirSync(TILESDIR);
const dbFiles = files.filter(f => [".mbtiles", ".sqlite"].indexOf(path.extname(f)) > -1)

const KEYS = (fs.existsSync("./keys.json")) ? require("./keys.json") : null;

//TEST THE INDEX HOMEPAGE ROUTE
test('requests the "/" route', async t => {
  const app = build()

  t.teardown(() => app.close())

  const response = await app.inject({
    method: 'GET',
    url: '/'
  })
  t.equal(response.statusCode, 200, 'returns a status code of 200')
})

//TEST THE STATIC ROUTE
test('requests the "/style.css" route', async t => {
  const app = build()

  t.teardown(() => app.close())

  const response = await app.inject({
    method: 'GET',
    url: '/style.css'
  })
  t.equal(response.statusCode, 200, 'returns a status code of 200')
})

//TEST THE WMTS ROUTE - FAILING!
test('requests the "/WMTS" route', async t => {
  const app = build()

  t.teardown(() => app.close())

  const response = await app.inject({
    method: 'GET',
    url: '/WMTS/1.0.0'
  })
  t.equal(response.statusCode, 200, 'returns a status code of 200')
})

//TEST THE TILEJSON ROUTE FOR EACH ROUTE
dbFiles.forEach(f => {
  test(`requests the ${path.basename(f)}/tilejson route`, async t => {
    const app = build()
  
    t.teardown(() => app.close())
  
    const response = await app.inject({
      method: 'GET',
      url: `${path.basename(f)}/tilejson`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
  })
});

//TEST THE WMTS XML ROUTE FOR EACH ROUTE
dbFiles.forEach(f => {
  test(`requests the ${path.basename(f)}/WMTS/1.0.0/WMTSCapabilities.xml route`, async t => {
    const app = build()
  
    t.teardown(() => app.close())
  
    const response = await app.inject({
      method: 'GET',
      url: `${path.basename(f)}/WMTS/1.0.0/WMTSCapabilities.xml`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
  })
});

//TEST THE MAP ROUTE FOR EACH ROUTE
dbFiles.forEach(f => {
  test(`requests the ${path.basename(f)}/map route`, async t => {
    const app = build()
  
    t.teardown(() => app.close())
  
    const response = await app.inject({
      method: 'GET',
      url: `${path.basename(f)}/map`
    })
    t.equal(response.statusCode, 200, 'returns a status code of 200')
  })
});