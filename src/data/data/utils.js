import * as R from 'ramda'

export const assocVersions = (state) => {
  console.log(state)
  const versions = R.pipe(
    R.omit(['ignore', 'versions']),
    R.map(R.identity)
  )(state)
  return R.assocPath(['versions'], versions, state)
}
