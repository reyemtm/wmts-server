const tilebelt = require("@mapbox/tilebelt")
const sharp = require("sharp");
const Database = require("better-sqlite3");
const ZOOMFACTOR = 3; //Global zoom factor allowed

const getZoomFactor = (format) => {
  if (!format || format === "pbf") return 0
  return ZOOMFACTOR
}

const toMapTile = (mercatorTile) => {
  //TILEBELT tile coords [10,15,8] or x 0,y 1,z 2
  //map tile coords = [8,10,15] or z 0, x 1, y2
  return [mercatorTile[2], mercatorTile[0], mercatorTile[1]]
}

const toMercatorTile = (mapTile) => {
  return [mapTile[1], mapTile[2], mapTile[0]]
}

const getTileMatrixPosition = (position) => {
  const tileClipMatrix = [{
  left: 0,
  top: 256
}, {
  left: 256,
  top: 256
}, {
  left: 256,
  top: 0
}, {
  left: 0,
  top: 0
  }]

  return tileClipMatrix[position]
}

const checkRasterFormatAndMaxzoom = (db) => {
  try {
    const getMeta = db.prepare(`SELECT name, value FROM metadata where name in ('maxzoom', 'format')`);
    const response = getMeta.all();
    if (!response) {
      throw new Error("Missing format or maxzoom in metadata.")
    }
    const flat = response.reduce((i,r) => {
      return [...i, (Number(r.value)) ? Number(r.value) : r.value]
    }, []).sort()
    return {
      isValid: ["jpg", "jpeg", "png"].includes(flat[1].toLowerCase()) && flat[0] >= 17,
      maxNativeZoom: flat[0]
    }
  } catch (error) {
    throw new Error("Error in OverZoom function: could not queyr database. " + error)      
  }
}

const getOriginTile = (zoomFactor, t) => {
  const _tile = t.slice();
  _tile.push(_tile.shift());
  switch (zoomFactor) {
    case 1 : return tilebelt.getParent(_tile);
    case 2 : return tilebelt.getParent(tilebelt.getParent(_tile));
    case 3 : return tilebelt.getParent(tilebelt.getParent(tilebelt.getParent(_tile)));
  }
}

/**
 * 
 * @param {Array} t Tile coordinate array in [x,y,z] format 
 * @returns {Object} The positon of the requested tile in the parent tile
 */
const getTileClipMatrix = (t, level) => {

  switch (level) {
    case 2 : this._tile = tilebelt.getParent(t);
    case 3 : this._tile = tilebelt.getParent(tilebelt.getParent(t));
    default : this._tile = t
  }

  const siblings = (!level || level === 1) ? tilebelt.getChildren(tilebelt.getParent(this._tile)) : (level === 2) ? tilebelt.getSiblings(this._tile) : null;
  const child = [];
  siblings.forEach((c, i) => {
    const ct = toMapTile(c)
    const t2 = toMapTile(this._tile)
    if (ct[1] === t2[1] && ct[2] === t2[2]) child.push(i)
  });
  return getTileMatrixPosition(child)
}

const getParentTilePosition = (t) => {
  
  const requestedParentTile = tilebelt.getParent(toMercatorTile(t));

  const requestedParentSiblings = tilebelt.getSiblings(requestedParentTile);
  const _child = []
  requestedParentSiblings.forEach((c, i) => {
    const ct = toMapTile(c)
    const rpt = toMapTile(requestedParentTile)
    if (ct[1] === rpt[1] && ct[2] === rpt[2]) _child.push(i)
  });
  return getTileMatrixPosition(_child)
}

const getOriginTileData = (db, t) => {
  try {
    const row = db.prepare('SELECT tile_data FROM tiles WHERE zoom_level = ? AND tile_column = ? AND tile_row = ?').get(toMapTile(t))
    if (!row) return false
    return row.tile_data
  }catch(err) {
    throw new Error("Overzoom error with getOriginTileData: " + err)
  }
}

const expandAndClipTile = async (tileData, matrix, meta) => {
  const metadata = (!meta) ? await sharp(tileData).metadata() : meta;
  const buffer = await sharp(tileData)
  .resize(512, 512, {
    kernel: sharp.kernel.lanczos3
  })
  .extract({
    left: matrix.left,
    top: matrix.top,
    width: 256,
    height: 256
  })
  .toFormat(metadata.format)
  .toBuffer();
  return {metadata, buffer}
}

/**
 * OverZoom function to allow for 2x the maxzoom level on raster tiles.
 * The function works by expanding the parent tile then extracting the child tile.
 * //TODO look into Possibly convert these functions to use the sharp.tile() fn?
 * @param {Object} db better-sqlite database object
 * @param {Array} tile tile coordinates in [z,x,y] format
 * @returns {Promise<ArrayBuffer>}
 */
async function overZoom(db, tile) {

  if (tile[0] < 18) return false
  
  const { isValid, maxNativeZoom }  = checkRasterFormatAndMaxzoom(db);
  const zoomFactor = tile[0] - maxNativeZoom;

  if (!isValid) return false;
  if (zoomFactor > (ZOOMFACTOR) || zoomFactor < 1) return false



  const originTile = getOriginTile(zoomFactor, tile);

  const tileClipMatrix = getTileClipMatrix(toMercatorTile(tile))
  const parentClipMatrix = getTileClipMatrix(tilebelt.getParent(toMercatorTile(tile)));
  const grandparentClipMatrix = getTileClipMatrix(tilebelt.getParent(tilebelt.getParent(toMercatorTile(tile))));

  const tileData = getOriginTileData(db, originTile);

  switch (zoomFactor) {
    case 1 : return expandAndClipTile(tileData, tileClipMatrix);
    case 2 : 
      const zf2 = await expandAndClipTile(tileData, parentClipMatrix);
      return expandAndClipTile(zf2.buffer, tileClipMatrix, zf2.metadata)
    case 3 : 
      const zf3 = await expandAndClipTile(tileData, grandparentClipMatrix);
      const _zf2 = await expandAndClipTile(zf3.buffer, parentClipMatrix, zf3.metadata);
      return expandAndClipTile(_zf2.buffer, tileClipMatrix, zf3.metadata)
    default: return false
  }

}

module.exports = {
  overZoom,
  getZoomFactor
}