import * as R from 'ramda'

import { STYLE_URL_BASE } from '../../../utils/constants'
import { styleId, themeId } from '../../../utils/enums'

export const getDefaultStyleId = R.ifElse(
  R.equals(themeId.DARK),
  R.always(styleId.DARK),
  R.always(styleId.LIGHT)
)

export const getMapStyle = (styleId) => `${STYLE_URL_BASE}${styleId}`
