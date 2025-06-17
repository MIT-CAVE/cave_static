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
  slotProps,
  onClick,
  children,
  ...props
}) => (
  <Tooltip
    aria-label={ariaLabel}
    {...{ title, placement, ...slotProps?.tooltip }}
    slotProps={{
      tooltip: { sx: [styles.tooltip, ...forceArray(slotProps?.tooltip?.sx)] },
    }}
  >
    <Box component="span">
      <IconButton
        size="large"
        {...slotProps?.button}
        sx={[
          styles.iconButton,
          ...forceArray(sx),
          ...forceArray(slotProps?.button?.sx),
        ]}
        {...{ onClick, ...props }}
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
  slotProps: PropTypes.shape({
    tooltip: PropTypes.object,
    button: PropTypes.object,
  }),
  onClick: PropTypes.func,
  children: PropTypes.node,
}

export default TooltipButton
