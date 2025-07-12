import { Divider, Grid, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import HelpTooltip from './HelpTooltip'
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
    border: '1px solid rgb(128 128 128)',
    borderRadius: 1,
    height: '100%',
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
  prop: {
    id,
    name,
    help,
    style, // `style` will become the default escape hatch for prop styling in `4.0.0`.
    propStyle, // Adding the `propStyle` key here for consistency.
  },
  variantStyle,
  sx,
  children,
  ...props
}) => {
  const title = name ?? id
  return (
    <Grid
      container
      sx={[styles.root, variantStyle, ...forceArray(sx), style, propStyle]}
      {...R.dissoc('currentVal')(props)}
    >
      <Grid component={Typography} variant="h5" sx={styles.title} size="grow">
        <OverflowText text={title} />
      </Grid>
      {help && (
        <Grid sx={{ p: 0.5, pr: 1 }}>
          <HelpTooltip {...{ title }} content={help} size={26} />
        </Grid>
      )}
      {children}
    </Grid>
  )
}
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
    <Grid component={Divider} sx={styles.divider} size={12} />
  </BaseContainer>
)

const PropHeadRow = (props) => (
  <BaseContainer variantStyle={styles.row} {...props} />
)

export { PropHeadColumn, PropHeadRow }
