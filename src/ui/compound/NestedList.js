/** @jsxImportSource @emotion/react */
import { Box, Checkbox } from '@mui/material'
import * as R from 'ramda'
import React from 'react'

const nonSx = {
  summaryClass: {
    '&:focus': {
      outline: 'none',
    },
    marginBottom: '5px',
  },
  details: {
    marginLeft: '35px',
    fontSize: '25px',
    cursor: 'pointer',
  },
}

const styles = {
  checkbox: {
    mr: 1,
  },
}

// This function returns a string of either true, false or mix
export const findValue = (object, selectedList) => {
  if (R.is(String, object))
    return R.includes(object, selectedList) ? 'true' : 'false'
  else {
    const mapped = R.values(object).map((value) =>
      findValue(value, selectedList)
    )
    return R.all(R.equals('true'), mapped)
      ? 'true'
      : R.any((val) => R.equals('true', val) || R.equals('mix', val), mapped)
        ? 'mix'
        : 'false'
  }
}

export const findHighestTruth = (object, selectedList) => {
  if (R.is(String, object[1]))
    return findValue(object[1], selectedList) === 'true' ? object[1] : []
  else if (findValue(object[1], selectedList) === 'true') {
    return [object[0]]
  } else if (findValue(object[1], selectedList) === 'mix')
    return R.unnest(
      R.map((item) => findHighestTruth(item, selectedList))(
        R.toPairs(object[1])
      )
    )
}

export const findBaseItems = (object) => {
  if (R.is(Array, object)) return object
  else {
    return R.reduce(
      (acc, value) => R.union(acc, findBaseItems(value)),
      {}
    )(R.values(object))
  }
}

// object should be a key, value pair equivilent to what R.toPairs() returns
export const createNestedList = (
  object,
  selectedList,
  onSelect,
  showFunction = R.T
) => {
  const value = findValue(object[1], selectedList)
  if (R.is(String, object[1])) {
    if (!showFunction(object[1])) return ''
    return (
      <Box
        sx={{
          marginLeft: '55px',
          marginBottom: '5px',
          fontSize: '25px',
          cursor: 'default',
        }}
        key={object[0]}
      >
        <Checkbox
          sx={styles.checkbox}
          checked={value === 'true'}
          indeterminate={value === 'mix'}
          onClick={() => {
            onSelect(object[1])
          }}
        />
        {object[1]}
      </Box>
    )
  } else if (!showFunction(object[0])) return ''
  else {
    return (
      <details css={nonSx.details} key={object[0]}>
        <summary css={nonSx.summaryClass}>
          <Checkbox
            sx={styles.checkbox}
            checked={value === 'true'}
            indeterminate={value === 'mix'}
            onClick={() => {
              onSelect(object[1])
            }}
          />
          {object[0]}
        </summary>
        {R.map((val) =>
          createNestedList(val, selectedList, onSelect, showFunction)
        )(R.toPairs(object[1]))}
      </details>
    )
  }
}
