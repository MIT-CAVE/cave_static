import { describe, it, expect } from 'vitest'

import { isMapboxStyle, includesPath } from '../../utils'

describe('includesPath', () => {
  it('returns true for exact path matches in array of paths', () => {
    const paths = [
      ['pages', 'currentPage'],
      ['panes', 'paneState', 'left'],
    ]
    expect(includesPath(paths, ['pages', 'currentPage'])).toBe(true)
    expect(includesPath(paths, ['panes', 'paneState', 'left'])).toBe(true)
  })

  it('returns true when candidate path is a child of a path in the list', () => {
    const paths = [['panes', 'paneState']]
    expect(includesPath(paths, ['panes', 'paneState', 'left'])).toBe(true)
    expect(includesPath(paths, ['panes', 'paneState', 'right', 'open'])).toBe(
      true
    )
  })

  it('returns false for non-matching or sibling paths', () => {
    const paths = [['panes', 'paneState', 'left']]
    expect(includesPath(paths, ['panes', 'paneState', 'right'])).toBe(false)
    expect(includesPath(paths, ['pages', 'currentPage'])).toBe(false)
    expect(includesPath(paths, ['panes'])).toBe(false)
  })
})

describe('isMapboxStyle', () => {
  it('identifies Mapbox URLs', () => {
    expect(isMapboxStyle('mapbox://styles/mapbox/dark-v11')).toBe(true)
    expect(isMapboxStyle('mapbox://styles/mapbox/streets-v12')).toBe(true)
    expect(
      isMapboxStyle(
        'https://api.mapbox.com/styles/v1/mapbox/dark-v11?access_token=pk.xxx'
      )
    ).toBe(true)
  })

  it('identifies non-Mapbox URLs (Carto, Stadia, OSM)', () => {
    expect(
      isMapboxStyle(
        'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
      )
    ).toBe(false)
    expect(
      isMapboxStyle(
        'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
      )
    ).toBe(false)
    expect(
      isMapboxStyle('https://tiles.stadiamaps.com/styles/alidade_smooth.json')
    ).toBe(false)
  })

  it('identifies style spec objects', () => {
    expect(
      isMapboxStyle({
        version: 8,
        glyphs:
          'https://tiles.basemaps.cartocdn.com/fonts/{fontstack}/{range}.pbf',
        sources: {
          'osm-raster-tiles': {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          },
        },
      })
    ).toBe(false)

    expect(
      isMapboxStyle({
        version: 8,
        glyphs: 'mapbox://fonts/mapbox/{fontstack}/{range}.pbf',
      })
    ).toBe(true)
  })
})
