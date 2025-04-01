import { Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'
import OverflowText from './OverflowText'

import { selectNumberFormatPropsFn } from '../../data/selectors'
import { PROP_MIN_WIDTH } from '../../utils/constants'

import { NumberFormat, forceArray } from '../../utils'

const styles = {
  root: {
    position: 'relative',
    minWidth: PROP_MIN_WIDTH,
    p: 2,
  },
  title: {
    mx: 1,
    // pr: 5,
    textAlign: 'start',
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
    bgcolor: 'grey.800',
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

// const GlobalOutputToggleIcon = ({ globalOutputId, mapGlobalOutput }) => {
//   const [hover, setHover] = useState(false)
//   const dispatch = useDispatch()
//   return (
//     <Box
//       sx={[styles.globalOutputToggleIcon, { opacity: mapGlobalOutput || hover ? 1 : 0.2 }]}
//       onMouseEnter={() => setHover(true)}
//       onMouseLeave={() => setHover(false)}
//       onClick={() => dispatch(mapGlobalOutputToggle(globalOutputId))}
//     >
//       {R.cond([
//         [R.and(hover), R.always(<MdBookmarkRemove />)],
//         [R.and(!hover), R.always(<MdBookmarkAdded />)],
//         [R.or(hover), R.always(<MdOutlineBookmarkAdd />)],
//         [R.T, R.always(<MdBookmarkBorder />)],
//       ])(mapGlobalOutput)}
//     </Box>
//   )
// }

const PropNumberIcon = ({ prop, sx = [], ...props }) => {
  const { name, value, icon, style } = prop
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  return (
    <Paper
      elevation={2}
      sx={[styles.root, style, ...forceArray(sx)]}
      // {...props}
    >
      <Grid container flexDirection="column" spacing={3}>
        <Grid sx={styles.title}>
          <OverflowText text={name} />
        </Grid>
        <Grid container spacing={1} wrap="nowrap">
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
PropNumberIcon.propTypes = {
  name: PropTypes.string,
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

export default PropNumberIcon
