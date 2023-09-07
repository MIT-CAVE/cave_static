import { Divider, Grid } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { GLOBALOUTPUT_WIDTH } from '../../utils/constants'

import { forceArray } from '../../utils'

const styles = {
  column: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    minWidth: GLOBALOUTPUT_WIDTH,
    px: 1,
    justifyContent: 'center',
    textAlign: 'center',
  },
  row: {
    display: 'flex',
    position: 'relative',
    flexDirection: 'column',
    minWidth: GLOBALOUTPUT_WIDTH,
    px: 2,
    placeContent: 'center',
    // textAlign: 'start',
    border: 1,
    borderColor: 'grey.500',
  },
  title: {
    px: 1,
    fontSize: '24px',
    whiteSpace: 'nowrap',
  },
}

const KpiHead = ({
  title,
  icon,
  style,
  sx = [],
  rootStyle,
  gridSpacing,
  gridTitleStyle,
  iconSize,
  children,
  ...props
}) => (
  <Grid
    sx={[rootStyle, style, ...forceArray(sx)]}
    {...R.dissoc('mapKpi', props)}
  >
    <Grid container item spacing={gridSpacing} flexWrap="nowrap">
      {icon && (
        <Grid item alignSelf="center">
          <FetchedIcon iconName={icon} size={iconSize} />
        </Grid>
      )}
      <Grid item xs={11} sx={gridTitleStyle}>
        <OverflowText text={title} sx={styles.title} />
      </Grid>
    </Grid>
    {children}
  </Grid>
)
KpiHead.propTypes = {
  title: PropTypes.string,
  icon: PropTypes.string,
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

const KpiHeadColumn = (props) => (
  <KpiHead rootStyle={styles.column} gridSpacing={1} iconSize={24} {...props}>
    <Divider sx={{ mt: 2 }} />
  </KpiHead>
)

const KpiHeadRow = (props) => (
  <KpiHead
    gridSpacing={2}
    iconSize={48}
    rootStyle={styles.row}
    gridTitleStyle={{
      display: 'flex',
      alignItems: 'center',
    }}
    {...props}
  />
)

export { KpiHeadColumn, KpiHeadRow }
