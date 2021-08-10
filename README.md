# WMTS NodeJS Tile Server

This project is based on previous work from the following:

- [mbtiles-server (Fastify)](https://github.com/tobinbradley/mbtiles-server)
- [mbtileserver (GO)](https://github.com/consbio/mbtileserver)
- [mbtiles-server (WMTS | Express)](https://github.com/DenisCarriere/mbtiles-server)
- [tileserver (Express)](https://github.com/ovrdc/tileserver) 
- [mbtiles-server (Original)](https://github.com/chelm/mbtiles-server)

## Why

The WMTS mbtiles-server project is no longer maintained, however the need still exists for a modern WMTS tile server. While working on bringing this functionality to the GO project above, the language barrier was steeper than anticipated so in the meantime I have created a working WMTS tile server for NodeJS from the examples above.

> This is a work in progress and all routes and functions may be changed.

## Purpose

Create a simple to use, performant tile server in NodeJS with WMTS and XYZ endpoints that reads from mbtiles sqlite database files. This is part of a FOSS4G toolchain to enable publishing geospatial data to the web.

## TODO

- [ ] Recreate Licking Tiles
- [ ] Recreate Pickaway Tiles

## Goals

- [ ] Enhance the tile server raster endpoints to serve enhanced imagery at `z*2` levels beyond that of the native `maxzoom`.
- [ ] Migrate the WMTS endpoints over to the GO project above.

---



## XYZ Routes Inherited from mbtiles-server (Fastify)

### List Available Tile Sets

```text
http://localhost:3000/list
```

### Show Available Meta for Tile Set

```text
http://localhost:3000/[mbtiles file]/meta
```

Ex: http://localhost:3000/tiles.mbtiles/meta

### Fetch a Tile

```text
http://localhost:3000/[mbtiles file]/[z]/[x]/[y]
```

Ex: http://localhost:3000/tiles.mbtiles/12/1128/1620

## Notes inherited from mbtiles-server (Fastify)

The [Fastify](https://www.fastify.io/) extensions [fastify-caching](https://github.com/fastify/fastify-caching) and [fastify-cors](https://github.com/fastify/fastify-cors) are used to set tile expiration (in seconds) and CORS. By default, expiration is 48 hours and CORS is set to `access-control-allow-origin: *`. See the Fastify projects to learn how to customize those options further.

If you are on Windows and `npm install` returns a compilation error, try running `npm install -g windows-build-tools` first.

By default, Fastify only listens to requests from `localhost` for security reasons. You can change the `host` constant in `.env` to `0.0.0.0` to listen to all IPv4 addresses. See the [Fastify listen docs](https://www.fastify.io/docs/latest/Server/#listen) for more details.

This tile server was originally inspired by Christopher Helm's awesome [mbtiles-server](https://github.com/chelm/mbtiles-server).