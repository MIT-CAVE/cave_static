/** @jsxImportSource @emotion/react */
import * as R from 'ramda'

import { serializeNumLabel } from '../../utils'

export const getGradientBox = R.curry(
  (maxColor, minColor, maxLabel, minLabel) => {
    const strMaxLabel = serializeNumLabel(maxLabel)
    const strMinLabel = serializeNumLabel(minLabel)
    return (
      <div
        css={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div
          css={{
            width: '60px',
            textAlign: 'left',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            whiteSpace: 'nowrap',
            flex: 0,
          }}
        >
          {strMinLabel}
        </div>
        <div
          css={{
            width: '60px',
            height: '18px',
            backgroundImage: `linear-gradient(to right, ${minColor}, ${maxColor})`,
            flex: '1 1 auto',
          }}
        />
        <div
          css={{
            textAlign: 'right',
            width: '60px',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            flex: 0,
          }}
        >
          {strMaxLabel}
        </div>
      </div>
    )
  }
)
