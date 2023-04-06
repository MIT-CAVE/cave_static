import { Box, Divider, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'

import InfoButton from './InfoButton'

import { forceArray } from '../../utils'

const styles = {
  column: {
    display: 'flex',
    position: 'relative',
    alignItems: 'flex-start',
    px: 0,
    py: 1,
    mx: 1,
    my: 1.5,
  },
  row: {
    display: 'flex',
    position: 'relative',
    alignItems: 'center',
    textAlign: 'start',
    border: 1,
    borderColor: 'grey.500',
    p: 2,

    flex: '1 1 auto',
  },
  info: {
    ml: 1,
    textAlign: 'right',
    flex: '1 1 auto',
  },
  divider: {
    height: '2px',
    mb: 1,
    opacity: 1,
  },
}

const PropHead = ({ prop = {}, sx = [], wrapperStyle, children, ...props }) => {
  const { id, name, help, style } = prop
  return (
    <Box
      display="flex"
      flexDirection="column"
      sx={[style, ...forceArray(sx)]}
      {...R.dissoc('currentVal', props)}
    >
      <Box sx={wrapperStyle}>
        <Typography variant="h5">{name || id}</Typography>
        {help && (
          <Box sx={styles.info}>
            <InfoButton text={help} sx={{ fontSize: 24 }} />
          </Box>
        )}
      </Box>
      {children}
    </Box>
  )
}
PropHead.propTypes = {
  prop: PropTypes.object,
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  children: PropTypes.node,
}

const PropHeadColumn = (props) => (
  <PropHead wrapperStyle={styles.column} {...props}>
    <Divider sx={styles.divider} />
  </PropHead>
)

const PropHeadRow = (props) => <PropHead wrapperStyle={styles.row} {...props} />

export { PropHeadColumn, PropHeadRow }
