import { ButtonBase } from '@mui/material'

import { forceArray } from '../../utils'

const RippleBox = ({ selected, sx = [], ...props }) => (
  <ButtonBase
    component="div"
    sx={[
      {
        border: `1px ${selected ? 'inset' : 'outset'} rgb(128 128 128)`,
        borderRadius: 1,
      },
      ...forceArray(sx),
    ]}
    {...props}
  />
)

export default RippleBox
