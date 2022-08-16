/** @jsxImportSource @emotion/react */
import * as R from 'ramda'
import React from 'react'
import { FaInfinity } from 'react-icons/fa'

export const getGradientBox = R.curry(
  (maxColor, minColor, maxLabel, minLabel) => {
    const strMaxLabel =
      minLabel === Infinity ? <FaInfinity /> : minLabel.toFixed(1)
    const strMinLabel =
      maxLabel === -Infinity ? (
        <>
          -<FaInfinity />
        </>
      ) : (
        maxLabel.toFixed(1)
      )
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
