export const luxuryMapStyle = {
  version: 8,
  name: "Luxury Dark",
  sources: {
    "mapbox": {
      type: "vector",
      url: "mapbox://mapbox.mapbox-streets-v8"
    }
  },
  sprite: "mapbox://sprites/mapbox/dark-v10",
  glyphs: "mapbox://fonts/mapbox/{fontstack}/{range}.pbf",
  layers: [
    {
      id: "background",
      type: "background",
      paint: {
        "background-color": "#0a0a0a"
      }
    },
    {
      id: "water",
      type: "fill",
      source: "mapbox",
      "source-layer": "water",
      paint: {
        "fill-color": "#111827",
        "fill-opacity": 0.7
      }
    },
    {
      id: "landuse",
      type: "fill",
      source: "mapbox",
      "source-layer": "landuse",
      paint: {
        "fill-color": "#0f0f0f",
        "fill-opacity": 0.3
      }
    },
    {
      id: "roads",
      type: "line",
      source: "mapbox",
      "source-layer": "road",
      paint: {
        "line-color": "#1a1a1a",
        "line-width": {
          base: 1.5,
          stops: [[12, 0.5], [20, 10]]
        },
        "line-opacity": 0.5
      }
    },
    {
      id: "buildings",
      type: "fill-extrusion",
      source: "mapbox",
      "source-layer": "building",
      paint: {
        "fill-extrusion-color": "#1f2937",
        "fill-extrusion-height": {
          type: "identity",
          property: "height"
        },
        "fill-extrusion-base": {
          type: "identity",
          property: "min_height"
        },
        "fill-extrusion-opacity": 0.3
      }
    },
    {
      id: "place-labels",
      type: "symbol",
      source: "mapbox",
      "source-layer": "place_label",
      layout: {
        "text-field": "{name}",
        "text-font": ["DIN Pro Medium", "Arial Unicode MS Regular"],
        "text-size": {
          base: 1,
          stops: [[12, 10], [16, 14]]
        },
        "text-transform": "uppercase",
        "text-letter-spacing": 0.1,
        "text-anchor": "center"
      },
      paint: {
        "text-color": "#B5985A",
        "text-halo-color": "#000000",
        "text-halo-width": 1.5,
        "text-opacity": 0.8
      }
    }
  ]
}

export const clusterPaint = {
  'circle-color': [
    'step',
    ['get', 'point_count'],
    '#B5985A',
    10,
    '#d4af37',
    50,
    '#ffd700'
  ],
  'circle-radius': [
    'step',
    ['get', 'point_count'],
    15,
    10,
    20,
    50,
    25
  ],
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-stroke-opacity': 0.3
}

export const markerPaint = {
  'circle-color': '#B5985A',
  'circle-radius': 8,
  'circle-stroke-width': 2,
  'circle-stroke-color': '#ffffff',
  'circle-stroke-opacity': 0.5
}