import { Box, Card, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useSelector } from 'react-redux'

import FetchedIcon from './FetchedIcon'

import { selectNumberFormatPropsFn } from '../../data/selectors'

import { NumberFormat, forceArray } from '../../utils'

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    gap: 1,
    height: '100%',
    boxSizing: 'border-box',
    py: 0.5,
    px: 1,
    borderRadius: 2,
  },
  badge: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    borderRadius: '50%',
    bgcolor: 'grey.800',
    flexShrink: 0,
  },
  text: {
    display: 'flex',
    flexDirection: 'column',
  },
  name: {
    whiteSpace: 'nowrap',
  },
  value: {
    whiteSpace: 'nowrap',
    fontWeight: (theme) => theme.typography.fontWeightBold,
  },
}

const PropNumberIconCompactAlt = ({ prop, sx = [] }) => {
  const { name, value, icon, color = 'text.secondary', style } = prop
  const numberFormatProps = useSelector(selectNumberFormatPropsFn)(prop)
  return (
    <Card elevation={2} sx={[styles.root, style, ...forceArray(sx)]}>
      <Box sx={[styles.badge, { color }]}>
        <FetchedIcon iconName={icon} size={18} />
      </Box>
      <Box sx={styles.text}>
        <Typography variant="caption" color="text.secondary" sx={styles.name}>
          {name}
        </Typography>
        <Typography variant="h6" sx={styles.value}>
          {NumberFormat.format(value, numberFormatProps)}
        </Typography>
      </Box>
    </Card>
  )
}
PropNumberIconCompactAlt.propTypes = {
  prop: PropTypes.shape({
    name: PropTypes.string,
    value: PropTypes.number,
    icon: PropTypes.string,
    color: PropTypes.string,
    style: PropTypes.object,
  }),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
}

export default PropNumberIconCompactAlt
