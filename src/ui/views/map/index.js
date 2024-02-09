import * as R from 'ramda'

import { DARK_GLOBE_FOG } from '../../../utils/constants'

export const getDefaultStyleId = (isMapboxTokenProvided) =>
  isMapboxTokenProvided ? 'mapboxDark' : 'cartoDarkMatter'

export const getDefaultFog = R.always(DARK_GLOBE_FOG)
