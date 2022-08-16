import sha256 from 'crypto-js/sha256'
import fetch from 'isomorphic-fetch'
import * as R from 'ramda'

const getDataNamesOnHashMismatch = (localHashes, hashes) => {
  const dataName = []
  for (const [key, value] of Object.entries(hashes)) {
    if (R.prop(key, localHashes) !== value) {
      dataName.push(key)
    }
  }
  return dataName
}

export const apiRequest = ({ url, options, responseFn, errorFn }) =>
  fetch(url, options)
    .then((response) => {
      if (responseFn) responseFn(response.ok) // REVIEW
      if (!response.ok) {
        throw new Error(`Network response was not ok: ${response.statusText}`)
      }
      return response.json()
    })
    .catch((error) => {
      if (errorFn) errorFn(error)
      throw new Error(error)
    })

export const getRequestParams = ({
  url,
  httpMethod = 'POST',
  body,
  authorized = true,
  responseFn = null,
  errorFn = null,
  authToken = null,
}) => ({
  url,
  options: {
    method: httpMethod,
    headers: {
      ...(httpMethod === 'POST' ? { 'Content-Type': 'application/json' } : {}),
      ...(authorized ? { Authorization: `Token ${authToken}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  },
  responseFn,
  errorFn,
})

export const sha256f12 = (data) => {
  return sha256(JSON.stringify(data)).toString().slice(0, 12)
}

export const assocHashes = (state) => {
  const hashes = R.pipe(R.omit(['ignore', 'hashes']), R.map(sha256f12))(state)
  return R.assocPath(['hashes'], hashes, state)
}

export const syncSession = async (localHashes, hashes, authToken) => {
  // calls a function to get updated data from the server where there is a hash mismatch.
  //  See POST /get_session_data/ in cave_test_server for more info
  // NOTE:
  // Do not call fetchData here, as syncSession is called from a reducer already.
  // Calling a reducer inside another reducer is an anti-pattern.
  const dataNames = getDataNamesOnHashMismatch(localHashes, hashes)
  if (dataNames.length > 0) {
    return await apiRequest(
      getRequestParams({
        url: `${window.location.ancestorOrigins[0]}/get_session_data/`,
        httpMethod: 'POST',
        body: { data_hashes: R.pick(dataNames)(localHashes) },
        authToken: authToken,
      })
    )
  } else {
    // No sync required. Hashes match.
    return { success: true, hashes: localHashes }
  }
}
