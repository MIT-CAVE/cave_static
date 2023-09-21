import { Divider, Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'

import InfoButton from './InfoButton'
import OverflowText from './OverflowText'

import { PROP_MIN_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  root: {
    minWidth: PROP_MIN_WIDTH,
    alignItems: 'center',
  },
  column: {
    alignContent: 'end',
  },
  row: {
    border: 1,
    borderColor: 'grey.500',
  },
  divider: {
    height: '2px',
    opacity: 1,
  },
  title: {
    py: 1,
    my: 1,
    pl: 1,
  },
}

const BaseContainer = ({
  prop: { id, name, help, style },
  variantStyle,
  sx,
  children,
  ...props
}) => (
  <Grid
    container
    sx={[variantStyle, styles.root, style, ...forceArray(sx)]}
    {...R.dissoc('currentVal')(props)}
  >
    <Grid
      item
      zeroMinWidth
      xs
      component={Typography}
      variant="h5"
      sx={styles.title}
    >
      <OverflowText text={name || id} />
    </Grid>
    {help && (
      <Grid item p={0.5}>
        <InfoButton text={help} sx={{ fontSize: 24 }} />
      </Grid>
    )}
    {children}
  </Grid>
)
BaseContainer.propTypes = {
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
  <BaseContainer variantStyle={styles.column} {...props}>
    <Grid item xs={12} component={Divider} sx={styles.divider} />
  </BaseContainer>
)

const PropHeadRow = (props) => (
  <BaseContainer variantStyle={styles.row} {...props} />
)

export { PropHeadColumn, PropHeadRow }
