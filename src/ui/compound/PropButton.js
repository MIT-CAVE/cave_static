import { Button, IconButton as MuiIconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import FetchedIcon from './FetchedIcon'

import { sendCommand } from '../../data/data'

import { forceArray, getContrastText } from '../../utils'

const styles = {
  getFilled: (color) => ({
    bgcolor: color,
    color: getContrastText(color),
    '&:hover': {
      bgcolor: `color-mix(in srgb, ${color}, transparent 25%)`,
    },
  }),
  getOutlined: (color) => ({
    borderColor: color,
    '&:hover': {
      bgcolor: `color-mix(in srgb, ${color}, transparent 85%)`,
    },
  }),
  getText: (color) => ({
    '&:hover': {
      bgcolor: `color-mix(in srgb, ${color}, transparent 85%)`,
    },
  }),
}

const StandardButton = ({
  prop: { name, value, startIcon, endIcon, color, fullWidth, propStyle },
  sx = [],
  ...props
}) => (
  <Button
    {...(startIcon && {
      startIcon: <FetchedIcon iconName={startIcon} />,
    })}
    {...(endIcon && {
      endIcon: <FetchedIcon iconName={endIcon} />,
    })}
    sx={[{ color }, ...forceArray(sx), propStyle]}
    {...{ fullWidth, ...props }}
  >
    {value ?? name}
  </Button>
)

const IconButton = ({
  prop: { icon, color, size, propStyle },
  sx = [],
  ...props
}) => (
  <MuiIconButton
    sx={[{ color, p: 0 }, ...forceArray(sx), propStyle]}
    {...props}
  >
    <FetchedIcon
      iconName={icon}
      {...{ color }}
      style={{ width: size, height: size }}
    />
  </MuiIconButton>
)

const ButtonBase = ({ component: Component, prop, variant, sx }) => {
  const {
    enabled,
    url,
    apiCommand,
    apiCommandKeys,
    dataName,
    dataPath,
    dataValue,
  } = prop
  const dispatch = useDispatch()
  const handleClick = useCallback(() => {
    if (!enabled) return
    dispatch(
      sendCommand({
        command: 'mutate_session',
        data: {
          api_command: apiCommand,
          api_command_keys: apiCommandKeys,
          data_name: dataName,
          data_path: dataPath,
          data_value: dataValue,
        },
      })
    )
  }, [
    dispatch,
    enabled,
    apiCommand,
    apiCommandKeys,
    dataName,
    dataPath,
    dataValue,
  ])
  return (
    <Component
      disabled={!enabled}
      href={url}
      target="_blank"
      {...{ variant, prop, sx }}
      onClick={handleClick}
    />
  )
}
ButtonBase.propTypes = {
  prop: PropTypes.object,
}

const PropButtonFilled = (props) => (
  <ButtonBase
    variant="contained"
    component={({ sx = [], ...btnProps }) => (
      <StandardButton
        sx={[
          btnProps.prop.color && styles.getFilled(btnProps.prop.color),
          ...forceArray(sx),
        ]}
        {...btnProps}
      />
    )}
    {...props}
  />
)

const PropButtonOutlined = (props) => (
  <ButtonBase
    variant="outlined"
    component={({ sx = [], ...btnProps }) => (
      <StandardButton
        sx={[
          btnProps.prop.color && styles.getOutlined(btnProps.prop.color),
          ...forceArray(sx),
        ]}
        {...btnProps}
      />
    )}
    {...props}
  />
)

const PropButtonText = (props) => (
  <ButtonBase
    variant="text"
    component={({ sx = [], ...btnProps }) => (
      <StandardButton
        sx={[
          btnProps.prop.color && styles.getText(btnProps.prop.color),
          ...forceArray(sx),
        ]}
        {...btnProps}
      />
    )}
    {...props}
  />
)

const PropButtonIcon = (props) => (
  <ButtonBase component={IconButton} {...props} />
)

export { PropButtonFilled, PropButtonOutlined, PropButtonText, PropButtonIcon }
