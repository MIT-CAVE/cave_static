import { Box, IconButton, Tooltip } from '@mui/material'
import PropTypes from 'prop-types'

import { forceArray } from '../../utils'

const styles = {
  tooltip: (theme) => ({
    maxWidth: 200,
    m: 1,
    ...theme.typography.caption,
  }),
  iconButton: {
    p: 0.5,
    opacity: 1,
    borderRadius: 'inherit',
  },
}

const TooltipButton = ({
  title,
  ariaLabel,
  placement = 'left',
  sx,
  onClick,
  children,
  ...props
}) => (
  <Tooltip
    {...{ title, placement }}
    aria-label={ariaLabel || title}
    slotProps={{ tooltip: { sx: styles.tooltip } }}
  >
    <Box component="span">
      <IconButton
        sx={[styles.iconButton, ...forceArray(sx)]}
        {...{ onClick, ...props }}
        size="large"
      >
        {children}
      </IconButton>
    </Box>
  </Tooltip>
)
TooltipButton.propTypes = {
  title: PropTypes.string,
  ariaLabel: PropTypes.string,
  placement: PropTypes.oneOf([
    'bottom-end',
    'bottom-start',
    'bottom',
    'left-end',
    'left-start',
    'left',
    'right-end',
    'right-start',
    'right',
    'top-end',
    'top-start',
    'top',
  ]),
  onClick: PropTypes.func,
  children: PropTypes.node,
}

export default TooltipButton
