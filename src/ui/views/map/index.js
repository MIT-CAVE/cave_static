import * as R from 'ramda'

import { styleId, themeId } from '../../../utils/enums'

export const getDefaultStyleId = R.ifElse(
  R.equals(themeId.DARK),
  R.always(styleId.DARK),
  R.always(styleId.LIGHT)
)
