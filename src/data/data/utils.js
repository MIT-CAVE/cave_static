import sha256 from 'crypto-js/sha256'
import * as R from 'ramda'

export const sha256f12 = (data) => {
  return sha256(JSON.stringify(data)).toString().slice(0, 12)
}

export const assocHashes = (state) => {
  const hashes = R.pipe(R.omit(['ignore', 'hashes']), R.map(sha256f12))(state)
  return R.assocPath(['hashes'], hashes, state)
}
