import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormatPropsFn } from '../../data/selectors'
import { GLOBALOUTPUT_WIDTH } from '../../utils/constants'

import { NumberFormat, forceArray } from '../../utils'

const styles = {
  root: {
    position: 'relative',
    minWidth: GLOBALOUTPUT_WIDTH,
    p: 2,
  },
  title: {
    mx: 1,
    pr: 5,
    fontSize: '24px',
    whiteSpace: 'nowrap',
    color: 'text.secondary',
    // Force the width of the container to be defined by the globalOutput value
    width: 0,
    minWidth: '100%',
  },
  value: {
    px: 2,
    fontSize: '42px',
    fontWeight: (theme) => theme.typography.fontWeightBold,
    letterSpacing: '0.03em',
  },
  icon: {
    color: 'text.secondary',
    bgcolor: (theme) =>
      theme.palette.mode === 'dark' ? 'grey.800' : 'grey.300',
    mx: 1,
    p: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '20%',
  },
  globalOutputToggleIcon: (theme) => ({
    position: 'absolute',
    fontSize: 26,
    top: theme.spacing(1),
    right: theme.spacing(1),
    cursor: 'pointer',
  }),
}

// const KpiToggleIcon = ({ globalOutputId, mapKpi }) => {
//   const [hover, setHover] = useState(false)
//   const dispatch = useDispatch()
//   return (
//     <Box
//       sx={[styles.globalOutputToggleIcon, { opacity: mapKpi || hover ? 1 : 0.2 }]}
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//       onClick={() => dispatch(mapKpiToggle(globalOutputId))}
//     >
//       {R.cond([
//         [R.and(hover), R.always(<MdBookmarkRemove />)],
//         [R.and(!hover), R.always(<MdBookmarkAdded />)],
//         [R.or(hover), R.always(<MdOutlineBookmarkAdd />)],
//         [R.T, R.always(<MdBookmarkBorder />)],
//       ])(mapKpi)}
//     </Box>
//   )
// }

const KpiBasic = ({ prop, sx = [], ...props }) => {
  const { title, value, icon, style } = prop
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  return (
    <Paper elevation={2} sx={[styles.root, style, ...forceArray(sx)]}>
      <Grid container flexDirection="column" spacing={0}>
        <Grid item sx={styles.title}>
          <OverflowText text={title} />
        </Grid>
        <Grid container item spacing={1} wrap="nowrap">
          {icon && (
            <Grid sx={styles.icon}>
              <FetchedIcon iconName={icon} size={36} />
            </Grid>
          )}
          {value != null && (
            <Typography sx={styles.value}>
              {NumberFormat.format(value, numberFormatProps)}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Paper>
  )
}
KpiBasic.propTypes = {
  title: PropTypes.string,
  value: PropTypes.number,
  icon: PropTypes.string,
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default KpiBasic