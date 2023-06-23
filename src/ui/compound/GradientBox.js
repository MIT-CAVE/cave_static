/** @jsxImportSource @emotion/react */
import * as R from 'ramda'

import OverflowText from './OverflowText'

export const getGradientBox = R.curry(
  (maxColor, minColor, maxLabel, minLabel) => {
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
            width: '70px',
            textAlign: 'center',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            flex: 0,
          }}
        >
          <OverflowText text={minLabel} />
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
            textAlign: 'center',
            width: '70px',
            marginRight: '10px',
            marginLeft: '10px',
            fontWeight: 700,
            flex: 0,
          }}
        >
          <OverflowText text={maxLabel} />
        </div>
      </div>
    )
  }
)
