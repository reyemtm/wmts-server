module.exports = () => {
  return {
    "version": 8,
    "sprite": "https://cdn.arcgis.com/sharing/rest/content/items/3e1a00aeae81496587988075fe529f71/resources/styles/../sprites/sprite",
    "glyphs": "https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/resources/fonts/{fontstack}/{range}.pbf",
    "sources": {
      "esri": {
        "type": "vector",
        "tiles": ["https://basemaps.arcgis.com/arcgis/rest/services/OpenStreetMap_v2/VectorTileServer/tile/{z}/{y}/{x}.pbf"],
        "maxzoom": 22,
        "attribution": "Map data <a href='https://www.openstreetmap.org/copyright' target='_blank'>©OpenStreetMap contributors</a>, Microsoft, Esri Community Maps contributors, <a href='https://www.arcgis.com/home/group.html?id=5e0d56e27d7e4a68955d399ca96c41cb#overview' target='_blank'>Map Style by Esri</a> | <a href='https://stamen.com/contact/' target='_blank'>Stamen</a>"
      }
    },
    "layers": [{
        "id": "background",
        "paint": {
          "background-color": "#fff"
        },
        "type": "background"
      },
      {
        "filter": [
          "match",
          ["get", "_symbol"],
          [48],
          true,
          false
        ],
        "id": "landcover_parks",
        "minzoom": 9,
        "paint": {
          "fill-antialias": true,
          "fill-color": {
            "stops": [
              [
                9,
                "rgba(10,10,10, 0.05)"
              ],
              [
                22,
                "rgba(10,10,10, 0.1)"
              ]
            ]
          },
          "fill-opacity": 1,
          "fill-outline-color": "rgba(0, 0, 0, 0)"
        },
        "source": "esri",
        "source-layer": "landcover",
        "type": "fill"
      },
      {
        "id": "ocean",
        "minzoom": 0,
        "paint": {
          "fill-antialias": true,
          "fill-color": "#000",
          "fill-opacity": 1,
          "fill-outline-color": "rgba(0, 0, 0, 0)"
        },
        "source": "esri",
        "source-layer": "ocean (large scale)",
        "type": "fill"
      },
      {
        "id": "ocean_1",
        "minzoom": 0,
        "paint": {
          "fill-antialias": true,
          "fill-color": "#000",
          "fill-opacity": 1,
          "fill-outline-color": "rgba(0, 0, 0, 0)"
        },
        "source": "esri",
        "source-layer": "ocean (small scale)",
        "type": "fill"
      },
      {
        "filter": [
          "<",
          "_symbol",
          7
        ],
        "id": "water",
        "minzoom": 0,
        "paint": {
          "fill-antialias": true,
          "fill-color": "#000",
          "fill-opacity": 1,
          "fill-outline-color": "rgba(0, 0, 0, 0)"
        },
        "source": "esri",
        "source-layer": "water area",
        "type": "fill"
      },
      {
        "id": "daylight_buildings",
        "minzoom": 10,
        "paint": {
          "fill-antialias": true,
          "fill-color": "rgb(230,230,230)",
          "fill-opacity": {
            "stops": [
              [10, 0],
              [18, 1]
            ]
          },
          "fill-outline-color": "transparent"
        },
        "source": "esri",
        "source-layer": "Daylight building",
        "type": "fill"
      },
      {
        "id": "railway/rail/casing",
        "type": "line",
        "source": "esri",
        "source-layer": "railway",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 7,
        "layout": {
          "line-join": "round"
        },
        "paint": {
          "line-color": "#121212",
          "line-opacity": {
            "stops": [
              [
                0, 0
              ],
              [18, 0.8]
            ]
          },
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                7,
                2
              ],
              [
                12,
                3
              ],
              [
                17,
                4
              ]
            ]
          }
        }
      },
      {
        "id": "railway/rail/line",
        "type": "line",
        "source": "esri",
        "source-layer": "railway",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 7,
        "layout": {
          "line-cap": "round",
          "line-join": "round"
        },
        "paint": {
          "line-color": "white",
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                7,
                0.8
              ],
              [
                11,
                0.75
              ],
              [
                12,
                1
              ],
              [
                17,
                2
              ]
            ]
          },
          "line-dasharray": {
            "stops": [
              [
                11.5,
                [
                  10,
                  10
                ]
              ],
              [
                11.6,
                [
                  8,
                  8
                ]
              ],
              [
                17,
                [
                  4,
                  4
                ]
              ]
            ]
          }
        }
      },
      {
        "filter": [
          ">",
          "_symbol",
          3
        ],
        "id": "minor_roads_links",
        "minzoom": 12,
        "paint": {
          "line-color": {
            "stops": [
              [
                12,
                "rgba(0, 0, 0, 0.4)"
              ],
              [
                18,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": 1
        },
        "source": "esri",
        "source-layer": "road link",
        "type": "line"
      },
      {
        "filter": [
          "<",
          "_symbol",
          3
        ],
        "id": "major_roads_links",
        "minzoom": 0,
        "paint": {
          "line-color": {
            "stops": [
              [
                9,
                "rgba(0, 0, 0, 0.4)"
              ],
              [
                16,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": {
            "stops": [
              [
                0,
                1
              ],
              [
                17,
                2
              ]
            ]
          }
        },
        "source": "esri",
        "source-layer": "road link",
        "type": "line"
      },
      {
        "filter": [
          ">",
          "_symbol",
          2
        ],
        "id": "minor_roads",
        "minzoom": 12,
        "paint": {
          "line-color": {
            "stops": [
              [
                12,
                "rgba(0, 0, 0, 0.4)"
              ],
              [
                18,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": 1
        },
        "source": "esri",
        "source-layer": "road",
        "type": "line"
      },
      {
        "filter": [
          "all",
          [
          "<",
          "_symbol",
          3],
          [
            ">",
            "_symbol",
            0
          ]
        ],
        "id": "major_roads",
        "minzoom": 0,
        "paint": {
          "line-color": {
            "stops": [
              [
                9,
                "rgba(0, 0, 0, 0.4)"
              ],
              [
                16,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": {
            "stops": [
              [
                0,
                1
              ],
              [
                17,
                2
              ]
            ]
          }
        },
        "source": "esri",
        "source-layer": "road",
        "type": "line"
      },
      {
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "id": "major_roads_ii",
        "minzoom": 0,
        "paint": {
          "line-color": {
            "stops": [
              [
                9,
                "rgba(0, 0, 0, 1)"
              ],
              [
                18,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": {
            "stops": [
              [
                9, 2
              ],
              [18, 6]
            ]
          }
        },
        "source": "esri",
        "source-layer": "road",
        "type": "line"
      },
      {
        "filter": [
          ">",
          "_symbol",
          2
        ],
        "id": "minor_bridges",
        "minzoom": 12,
        "paint": {
          "line-color": {
            "stops": [
              [
                12,
                "rgba(0, 0, 0, 0.4)"
              ],
              [
                16,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": 1
        },
        "source": "esri",
        "source-layer": "road (bridge)",
        "type": "line"
      },
      {
        "filter": [
          "<",
          "_symbol",
          3
        ],
        "id": "major_bridges",
        "minzoom": 0,
        "paint": {
          "line-color": {
            "stops": [
              [
                9,
                "rgba(0, 0, 0, 1)"
              ],
              [
                16,
                "rgba(0, 0, 0, 1)"
              ]
            ]
          },
          "line-width": {
            "stops": [
              [
                9,
                2
              ],
              [
                18,
                6
              ]
            ]
          }
        },
        "source": "esri",
        "source-layer": "road (bridge)",
        "type": "line"
      },
      {
        "id": "railway (bridge)/rail/inner casing",
        "type": "line",
        "source": "esri",
        "source-layer": "railway (bridge)",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 12,
        "layout": {
          "line-join": "round"
        },
        "paint": {
          "line-color": "#ffffff",
          "line-width": 5
        }
      },
      {
        "id": "railway (bridge)/rail/outer line",
        "type": "line",
        "source": "esri",
        "source-layer": "railway (bridge)",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 11,
        "layout": {
          "line-join": "round"
        },
        "paint": {
          "line-color": "#707070",
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                11,
                2
              ],
              [
                12,
                3
              ],
              [
                17,
                4
              ]
            ]
          }
        }
      },
      {
        "id": "railway (bridge)/rail/inner line",
        "type": "line",
        "source": "esri",
        "source-layer": "railway (bridge)",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 11,
        "layout": {
          "line-join": "round"
        },
        "paint": {
          "line-color": "#FFFFFF",
          "line-dasharray": {
            "stops": [
              [
                11,
                [
                  12,
                  12
                ]
              ],
              [
                17,
                [
                  4,
                  4
                ]
              ]
            ]
          },
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                11,
                0.75
              ],
              [
                12,
                1
              ],
              [
                17,
                2
              ]
            ]
          }
        }
      },
      {
        "id": "administrative boundary/level 10",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          8
        ],
        "minzoom": 13,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            1,
            2.5
          ],
          "line-width": 1.5
        }
      },
      {
        "id": "administrative boundary/level 9",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          7
        ],
        "minzoom": 12,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            1,
            2.5
          ],
          "line-width": 1.5
        }
      },
      {
        "id": "administrative boundary/level 8",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          6
        ],
        "minzoom": 11,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            3.5,
            1.5
          ],
          "line-width": 1.5
        }
      },
      {
        "id": "administrative boundary/level 7",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          5
        ],
        "minzoom": 10,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            3.5,
            1.5
          ],
          "line-width": 1.5
        }
      },
      {
        "id": "administrative boundary/level 6",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          4
        ],
        "minzoom": 9,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            7,
            1.5
          ],
          "line-width": 2
        }
      },
      {
        "id": "administrative boundary/level 5",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          3
        ],
        "minzoom": 7,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.22)",
          "line-opacity": 0.5,
          "line-dasharray": [
            7,
            1.5
          ],
          "line-width": 2
        }
      },
      {
        "id": "administrative boundary/level 4",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          2
        ],
        "minzoom": 3,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.21)",
          "line-opacity": 0.5,
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                3,
                0.4
              ],
              [
                4,
                0.5
              ],
              [
                5,
                0.6
              ],
              [
                6,
                1
              ],
              [
                8,
                1.8
              ],
              [
                9,
                2.5
              ],
              [
                11,
                3
              ]
            ]
          },
          "line-dasharray": {
            "stops": [
              [
                8.5,
                [
                  1,
                  0
                ]
              ],
              [
                8.6,
                [
                  1.7,
                  1.3
                ]
              ],
              [
                11,
                [
                  1.5,
                  1
                ]
              ]
            ]
          }
        }
      },
      {
        "id": "administrative boundary/level 3",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          1
        ],
        "minzoom": 3,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.21)",
          "line-opacity": 0.5,
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                3,
                0.6
              ],
              [
                6,
                1.2
              ],
              [
                9,
                4
              ]
            ]
          },
          "line-dasharray": {
            "stops": [
              [
                8.5,
                [
                  1,
                  0
                ]
              ],
              [
                8.6,
                [
                  4,
                  2
                ]
              ]
            ]
          }
        }
      },
      {
        "id": "administrative boundary/level 2",
        "type": "line",
        "source": "esri",
        "source-layer": "administrative boundary",
        "filter": [
          "==",
          "_symbol",
          0
        ],
        "minzoom": 3,
        "layout": {
          "line-join": "bevel"
        },
        "paint": {
          "line-color": "rgba(0,0,0,0.21)",
          "line-opacity": 0.5,
          "line-width": {
            "base": 1.2,
            "stops": [
              [
                3,
                1.2
              ],
              [
                4,
                1.5
              ],
              [
                5,
                1.8
              ],
              [
                6,
                2
              ],
              [
                7,
                3
              ],
              [
                8,
                3.2
              ],
              [
                9,
                6
              ]
            ]
          }
        }
      },
      {
        "id": "administrative label/county level 6",
        "type": "symbol",
        "source": "esri",
        "source-layer": "administrative label/label",
        "filter": [
          "==",
          "_label_class",
          3
        ],
        "minzoom": 9,
        "layout": {
          "text-font": [
            "Arial Unicode MS Regular"
          ],
          "text-size": {
            "stops": [
              [
                9,
                10
              ],
              [
                11,
                11
              ]
            ]
          },
          "text-max-width": {
            "stops": [
              [
                9,
                13
              ],
              [
                11,
                14
              ]
            ]
          },
          "text-padding": {
            "stops": [
              [
                9,
                8.4
              ],
              [
                11,
                9.8
              ]
            ]
          },
          "text-line-height": {
            "stops": [
              [
                9,
                1.12
              ],
              [
                11,
                1.15
              ]
            ]
          },
          "text-field": "{_name}",
          "text-optional": true
        },
        "paint": {
          "text-color": "#121212",
          "text-halo-color": "white",
          "text-halo-width": 1.5
        }
      },
      {
        "id": "administrative label/county level 5",
        "type": "symbol",
        "source": "esri",
        "source-layer": "administrative label/label",
        "filter": [
          "==",
          "_label_class",
          2
        ],
        "minzoom": 7,
        "layout": {
          "text-font": [
            "Arial Unicode MS Regular"
          ],
          "text-size": {
            "stops": [
              [
                7,
                10
              ],
              [
                9,
                12
              ],
              [
                11,
                13
              ]
            ]
          },
          "text-max-width": {
            "stops": [
              [
                7,
                12
              ],
              [
                8,
                13
              ],
              [
                9,
                14
              ],
              [
                11,
                15
              ]
            ]
          },
          "text-padding": {
            "stops": [
              [
                7,
                7.7
              ],
              [
                8,
                8.4
              ],
              [
                9,
                9.8
              ],
              [
                11,
                10.5
              ]
            ]
          },
          "text-line-height": {
            "stops": [
              [
                7,
                1
              ],
              [
                8,
                1.12
              ],
              [
                9,
                1.15
              ],
              [
                11,
                1.17
              ]
            ]
          },
          "text-field": "{_name}",
          "text-optional": true
        },
        "paint": {
          "text-color": "#121212",
          "text-halo-color": "white",
          "text-halo-width": 1.5
        }
      },
      {
        "id": "administrative label/state",
        "type": "symbol",
        "source": "esri",
        "source-layer": "administrative label/label",
        "filter": [
          "==",
          "_label_class",
          1
        ],
        "minzoom": 4,
        "maxzoom": 15,
        "layout": {
          "text-font": [
            "Arial Unicode MS Bold"
          ],
          "text-size": {
            "stops": [
              [
                4,
                10
              ],
              [
                6,
                11
              ],
              [
                8,
                12
              ],
              [
                9,
                13
              ],
              [
                11,
                15
              ]
            ]
          },
          "text-max-width": {
            "stops": [
              [
                4,
                8
              ],
              [
                6,
                10
              ]
            ]
          },
          "text-padding": {
            "stops": [
              [
                4,
                7
              ],
              [
                6,
                7.7
              ]
            ]
          },
          "text-line-height": {
            "stops": [
              [
                4,
                1
              ],
              [
                6,
                1.2
              ],
              [
                8,
                1.6
              ],
              [
                10,
                1.8
              ]
            ]
          },
          "text-field": "{_name}",
          "text-optional": true
        },
        "paint": {
          "text-color": "#121212",
          "text-halo-color": "white",
          "text-halo-width": 1.5
        }
      },
      {
        "id": "administrative label/country",
        "type": "symbol",
        "source": "esri",
        "source-layer": "administrative label/label",
        "filter": [
          "==",
          "_label_class",
          0
        ],
        "minzoom": 2,
        "maxzoom": 15,
        "layout": {
          "text-font": [
            "Arial Unicode MS Bold"
          ],
          "text-size": {
            "stops": [
              [
                2,
                10
              ],
              [
                3,
                11
              ],
              [
                4,
                12
              ],
              [
                6,
                13
              ],
              [
                8,
                14
              ],
              [
                9,
                15
              ]
            ]
          },
          "text-max-width": {
            "stops": [
              [
                2,
                6
              ],
              [
                3,
                7
              ],
              [
                4,
                8
              ],
              [
                6,
                9
              ],
              [
                9,
                10
              ]
            ]
          },
          "text-padding": {
            "stops": [
              [
                2,
                7
              ],
              [
                3,
                7.7
              ],
              [
                4,
                8.4
              ],
              [
                6,
                9.1
              ]
            ]
          },
          "text-line-height": {
            "stops": [
              [
                2,
                1.2
              ],
              [
                3,
                1.3
              ],
              [
                4,
                1.4
              ],
              [
                6,
                1.6
              ],
              [
                9,
                1.8
              ]
            ]
          },
          "text-letter-spacing": 0.05,
          "text-field": "{_name}",
          "text-optional": true
        },
        "paint": {
          "text-color": "#121212",
          "text-halo-color": "white",
          "text-halo-width": 1.5
        }
      }
    ]
  }
}