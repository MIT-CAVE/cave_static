import { Box, Divider, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import React from 'react'

import InfoButton from './InfoButton'

import { forceArray } from '../../utils'

const styles = {
  root: (theme) => ({
    display: 'flex',
    position: 'relative',
    alignItems: 'flex-start',
    p: theme.spacing(1, 0),
    m: theme.spacing(1.5, 1),
  }),
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

const PropHead = ({ prop = {}, sx = [], ...props }) => {
  const { id, name, help, style } = prop
  return (
    <Box sx={[style, ...forceArray(sx)]} {...props}>
      <Box sx={styles.root}>
        <Typography variant="h5">{name || id}</Typography>
        {help && (
          <Box sx={styles.info}>
            <InfoButton text={help} sx={{ fontSize: 24 }} />
          </Box>
        )}
      </Box>
      <Divider sx={styles.divider} />
    </Box>
  )
}
PropHead.propTypes = {
  prop: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropHead
