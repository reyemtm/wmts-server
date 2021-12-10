# WMTS NodeJS Tile Server

This project is based on previous work from the following:

- [mbtiles-server (Fastify)](https://github.com/tobinbradley/mbtiles-server)
- [mbtileserver (GO)](https://github.com/consbio/mbtileserver)
- [mbtiles-server (WMTS | Express)](https://github.com/DenisCarriere/mbtiles-server)
- [tileserver (Express)](https://github.com/ovrdc/tileserver) 
- [mbtiles-server (Original)](https://github.com/chelm/mbtiles-server)

## Why

The WMTS mbtiles-server project is no longer maintained so this project attempts to bring WMTS functionality to  a tile server that works with a modern version of NodeJS. My initial efforts centered around bringing this functionality to the [mbtileserver (GO)](https://github.com/consbio/mbtileserver) project, but the language barrier was steeper than anticipated. The result is this work-in-progress WMTS tile server for NodeJS with a few added features.

> NOTE: This is a work in progress and all routes and functions may be changed.

## Purpose

Create a simple to use, performant tile server in NodeJS with WMTS and XYZ endpoints that reads from an `mbtiles` database files. This is part of larger a Free and OpenSource for GIS toolchain for publishing geospatial data to the web.

## Features

- Tilejson Endpoint
- WMTS Endpoint (for use in ArcGIS Online)
- Map Preview
- Overzoom 3x for raster tiles

## Requirements

- mbtiles raster tiles must be 256x256
- mbtiles must have the following metadata 

```JavaScript
{
  "name": "any name",
  "format": "jpg | png | jpeg | pbf", //grid is not tested
  "minzoom": 0, //min zoom of the tiles,
  "maxzoom": 21, //max zoom of the tiles, 3x overzoom enabled on any tiles with a maxzoom > 16
  "bounds": [
    -82.85133361816406,
    39.55064761909319,
    -82.36089706420898,
    39.94935861566368
  ] //bounds of the tiles
}
```

## TODO

- [ ] Test grid tiles

## Goals

- [ ] Migrate the WMTS endpoints over to the GO project above.
- [ ] Create a universal Docker version

---

## Routes

### List Available Tile Sets

```text
http://localhost:3000/
```

### Fetch a Tile

```text
http://localhost:3000/[mbtiles file]/[z]/[x]/[y].ext //extension is optional
```

### Tilejson

```text
http://localhost:3000/[mbtiles file]/tilejson //extension is optional
```

### WMTS

```text
http://localhost:3000/[mbtiles file]/WMTS //extension is optional
```

Ex: http://localhost:3000/tiles.mbtiles/12/1128/1620.png

## Notes inherited from mbtiles-server (Fastify)

The [Fastify](https://www.fastify.io/) extensions [fastify-caching](https://github.com/fastify/fastify-caching) and [fastify-cors](https://github.com/fastify/fastify-cors) are used to set tile expiration (in seconds) and CORS. By default, expiration is 48 hours and CORS is set to `access-control-allow-origin: *`. See the Fastify projects to learn how to customize those options further.

If you are on Windows and `npm install` returns a compilation error, try running `npm install -g windows-build-tools` first.

By default, Fastify only listens to requests from `localhost` for security reasons. You can change the `host` constant in `.env` to `0.0.0.0` to listen to all IPv4 addresses. See the [Fastify listen docs](https://www.fastify.io/docs/latest/Server/#listen) for more details.

This tile server was originally inspired by Christopher Helm's awesome [mbtiles-server](https://github.com/chelm/mbtiles-server).