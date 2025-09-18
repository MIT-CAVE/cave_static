import { Button, IconButton as MuiIconButton } from '@mui/material'
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

const useButton = ({
  enabled,
  apiCommand,
  apiCommandKeys,
  dataName,
  dataPath,
  dataValue,
}) => {
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

  return {
    disabled: !enabled,
    handleClick,
  }
}

const StandardButton = ({ prop, variant, sx = [] }) => {
  const { disabled, handleClick } = useButton(prop)
  const { name, value, startIcon, endIcon, color, fullWidth, propStyle, url } =
    prop
  return (
    <Button
      href={url}
      target="_blank"
      sx={[{ color }, ...forceArray(sx), propStyle]}
      {...{ disabled, variant, fullWidth }}
      {...(startIcon && {
        startIcon: <FetchedIcon iconName={startIcon} />,
      })}
      {...(endIcon && {
        endIcon: <FetchedIcon iconName={endIcon} />,
      })}
      onClick={handleClick}
    >
      {value ?? name}
    </Button>
  )
}

const PropButtonFilled = ({ sx = [], ...props }) => (
  <StandardButton
    variant="contained"
    sx={[...forceArray(sx), styles.getFilled(props.prop.color)]}
    {...props}
  />
)

const PropButtonOutlined = ({ sx = [], ...props }) => (
  <StandardButton
    variant="outlined"
    sx={[...forceArray(sx), styles.getOutlined(props.prop.color)]}
    {...props}
  />
)

const PropButtonText = ({ sx = [], ...props }) => (
  <StandardButton
    variant="text"
    sx={[...forceArray(sx), styles.getText(props.prop.color)]}
    {...props}
  />
)

const PropButtonIcon = ({ prop, sx = [] }) => {
  const { disabled, handleClick } = useButton(prop)
  const { icon, color, size, url, propStyle } = prop
  return (
    <MuiIconButton
      {...{ disabled, handleClick }}
      href={url}
      target="_blank"
      sx={[{ color, p: 0 }, ...forceArray(sx), propStyle]}
    >
      <FetchedIcon
        iconName={icon}
        {...{ color }}
        style={{ width: size, height: size }}
      />
    </MuiIconButton>
  )
}

export { PropButtonFilled, PropButtonOutlined, PropButtonText, PropButtonIcon }
