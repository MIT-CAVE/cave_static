import * as R from 'ramda'

import { DARK_GLOBE_FOG } from '../../../utils/constants'

export const getDefaultStyleId = R.always('dark_matter')

export const getDefaultFog = R.always(DARK_GLOBE_FOG)
