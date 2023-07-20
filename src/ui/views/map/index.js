import * as R from 'ramda'

import { themeId } from '../../../utils/enums'

export const getDefaultStyleId = R.ifElse(
  R.equals(themeId.DARK),
  R.always('dark_matter'),
  R.always('positron')
)
