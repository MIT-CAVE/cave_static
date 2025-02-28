class ColorGenerator {
  constructor(seed) {
    this.setSeed(seed)
    this.colorData = {}
    this.colorType = ''
  }

  // Color Generators
  HSL() {
    this.colorType = 'hsl'
    this.colorData = {
      h: Math.round(this.nextRandom() * 360),
      s: Math.round(this.nextRandom() * 100),
      l: Math.round(this.nextRandom() * 100),
    }
  }

  RGB() {
    this.colorType = 'rgb'
    this.colorData = {
      r: Math.round(this.nextRandom() * 255),
      g: Math.round(this.nextRandom() * 255),
      b: Math.round(this.nextRandom() * 255),
    }
  }

  HEX() {
    this.colorType = 'hex'
    this.colorData = {
      hex:
        Math.round(this.nextRandom() * 255).toString(16) +
        Math.round(this.nextRandom() * 255).toString(16) +
        Math.round(this.nextRandom() * 255).toString(16),
    }
  }

  // Cutom Color Generators
  brightHSL() {
    this.colorType = 'hsl'
    this.colorData = {
      h: Math.round(this.nextRandom() * 360),
      s: 100,
      l: Math.round((this.nextRandom() * 3.6) ** 3 + 50),
    }
  }

  // Methods to convert the generated color into a string
  getHSLString() {
    var hslData = this.colorData
    if (this.colorType !== 'hsl') {
      var unifiedData = this.getUnifiedData()
      hslData = this.rgbToHSL(unifiedData.r, unifiedData.g, unifiedData.b)
    }
    return `hsl(${hslData.h}, ${hslData.s}%, ${hslData.l}%)`
  }

  getRGBString() {
    var rgbData = this.colorData
    if (this.colorType !== 'rgb') {
      rgbData = this.getUnifiedData()
    }
    return `rgb(${rgbData.r}, ${rgbData.g}, ${rgbData.b})`
  }

  getHEXString() {
    var hexData = this.colorData
    if (this.colorType !== 'hex') {
      var unifiedData = this.getUnifiedData()
      hexData = this.rgbToHex(unifiedData.r, unifiedData.g, unifiedData.b)
    }
    return `#${hexData.hex}`
  }

  // Utility Methods
  getUnifiedData() {
    if (this.colorType === 'hex') {
      return this.hexToRGB(this.colorData)
    }
    if (this.colorType === 'hsl') {
      return this.hslToRGB(this.colorData)
    }
    if (this.colorType === 'rgb') {
      return this.colorData
    }
  }

  hexToRGB(data) {
    return {
      r: parseInt(data.hex.substring(0, 2), 16),
      g: parseInt(data.hex.substring(2, 4), 16),
      b: parseInt(data.hex.substring(4, 6), 16),
    }
  }

  hslToRGB(data) {
    let { h, s, l } = data
    s /= 100
    l /= 100

    const k = (n) => (n + h / 30) % 12
    const a = s * Math.min(l, 1 - l)
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
    return {
      r: Math.round(f(0) * 255),
      g: Math.round(f(8) * 255),
      b: Math.round(f(4) * 255),
    }
  }

  rgbToHex(data) {
    return {
      hex: ((data.r << 16) + (data.g << 8) + data.b)
        .toString(16)
        .padStart(6, '0'),
    }
  }

  rgbToHSL(data) {
    let { r, g, b } = data
    r /= 255
    g /= 255
    b /= 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min

    let h = 0
    if (d === 0) {
      h = 0
    } else if (max === r) {
      h = ((g - b) / d) % 6
    } else if (max === g) {
      h = (b - r) / d + 2
    } else {
      h = (r - g) / d + 4
    }

    h = Math.round(h * 60)
    if (h < 0) h += 360

    const l = (max + min) / 2
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))

    return { h: h, s: Math.round(s * 100), l: Math.round(l * 100) }
  }

  // Randomization functions
  // Convert a string to a base 10 number for use as a seed
  setSeed(str) {
    var seedStr = `${str}cave` // Add more entropy to the seed for short strings
    var num = 0
    for (var i = 0; i < seedStr.length; i++) {
      num = num * 31 + seedStr.charCodeAt(i)
    }
    this.seed = num
  }

  // Generate a random number between 0 and 1 using a variant of Park-Miller LCG
  nextRandom() {
    this.seed = (this.seed * 16807) % 2147483647
    return this.seed / 2147483647
  }
}

const between = (num, min, max) => num >= min && num <= max

export const colorGen = (uniqueId) => {
  var colorGenerator = new ColorGenerator(uniqueId)
  colorGenerator.brightHSL()
  // Dont allow dark blues as they do not have enough contrast with dark grey
  while (
    between(colorGenerator.colorData.h, 204, 280) &&
    colorGenerator.colorData.l < 70
  )
    colorGenerator.brightHSL()
  return colorGenerator.getHSLString()
}
