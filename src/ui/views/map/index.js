import * as R from 'ramda'

import { DARK_GLOBE_FOG, LIGHT_GLOBE_FOG } from '../../../utils/constants'
import { themeId } from '../../../utils/enums'

export const getDefaultStyleId = R.ifElse(
  R.equals(themeId.DARK),
  R.always('dark_matter'),
  R.always('positron')
)

export const getDefaultFog = R.ifElse(
  R.equals(themeId.DARK),
  R.always(DARK_GLOBE_FOG),
  R.always(LIGHT_GLOBE_FOG)
)
