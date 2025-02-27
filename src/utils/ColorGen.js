class Generator {
  constructor(seed) {
    // convert the seed from a string into a number
    this.seed = this.stringToNumber(seed)
  }

  // Convert a string to a base 10 number
  stringToNumber(str) {
    var num = 0
    for (var i = 0; i < str.length; i++) {
      num = num * 31 + str.charCodeAt(i)
    }
    return num
  }

  // Generate a random number between 0 and 1 using a variant of Park-Miller LCG
  next() {
    this.seed = (this.seed * 16807) % 2147483647
    return this.seed / 2147483647
  }

  RGB() {
    return [
      Math.round(this.next() * 255),
      Math.round(this.next() * 255),
      Math.round(this.next() * 255),
    ]
  }
}

const toHex = (d) => {
  return `'0${Number(d).toString(16)}`.slice(-2).toUpperCase()
}

export const colorGen = (uniqueId) => {
  const generator = new Generator(uniqueId)

  var [R, G, B] = generator.RGB()

  // Handle Dark Mode
  while (R + G + B > 300) [R, G, B] = generator.RGB()

  // return `rgb(${R},${G},${B})`;
  return `#${toHex(R)}${toHex(G)}${toHex(B)}`
}
