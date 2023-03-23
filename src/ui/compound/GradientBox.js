/** @jsxImportSource @emotion/react */
import * as R from 'ramda'

import { serializeLabel } from '../../utils'

export const getGradientBox = R.curry(
  (maxColor, minColor, maxLabel, minLabel) => {
    const strMaxLabel = serializeLabel(maxLabel)
    const strMinLabel = serializeLabel(minLabel)
    return (
      <div
        css={{
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <div
          css={{
            textAlign: 'left',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
          }}
        >
          {strMinLabel}
        </div>
        <div
          css={{
            width: '100%',
            minWidth: '30px',
            backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
          }}
        />
        <div
          css={{
            textAlign: 'right',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
          }}
        >
          {strMaxLabel}
        </div>
      </div>
    )
  }
)
