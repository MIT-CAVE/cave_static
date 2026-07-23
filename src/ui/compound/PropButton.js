import { Button, IconButton as MuiIconButton } from '@mui/material'
import PropTypes from 'prop-types'
import { useCallback } from 'react'
import { useDispatch } from 'react-redux'

import FetchedIcon from './FetchedIcon'

import { sendCommand } from '../../data/data'

import { forceArray, getContrastText } from '../../utils'

const sxPropType = PropTypes.oneOfType([
  PropTypes.arrayOf(
    PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
  ),
  PropTypes.func,
  PropTypes.object,
])

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
  url,
  suppressCommand,
}) => {
  const dispatch = useDispatch()
  const handleClick = useCallback(() => {
    if (!enabled) return
    // Lets `url` act as a pure link when both it and an `apiCommand` are set
    if (suppressCommand && url) return
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
    url,
    suppressCommand,
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
      rel="noopener noreferrer"
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
StandardButton.propTypes = {
  prop: PropTypes.object,
  variant: PropTypes.string,
  sx: sxPropType,
}

const PropButtonFilled = ({ sx = [], ...props }) => (
  <StandardButton
    variant="contained"
    sx={[...forceArray(sx), styles.getFilled(props.prop.color)]}
    {...props}
  />
)
PropButtonFilled.propTypes = {
  prop: PropTypes.object,
  sx: sxPropType,
}

const PropButtonOutlined = ({ sx = [], ...props }) => (
  <StandardButton
    variant="outlined"
    sx={[...forceArray(sx), styles.getOutlined(props.prop.color)]}
    {...props}
  />
)
PropButtonOutlined.propTypes = {
  prop: PropTypes.object,
  sx: sxPropType,
}

const PropButtonText = ({ sx = [], ...props }) => (
  <StandardButton
    variant="text"
    sx={[...forceArray(sx), styles.getText(props.prop.color)]}
    {...props}
  />
)
PropButtonText.propTypes = {
  prop: PropTypes.object,
  sx: sxPropType,
}

const PropButtonIcon = ({ prop, sx = [] }) => {
  const { disabled, handleClick } = useButton(prop)
  const { icon, color, size, url, propStyle } = prop
  return (
    <MuiIconButton
      {...{ disabled }}
      onClick={handleClick}
      href={url}
      target="_blank"
      rel="noopener noreferrer"
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
PropButtonIcon.propTypes = {
  prop: PropTypes.object,
  sx: sxPropType,
}

export { PropButtonFilled, PropButtonOutlined, PropButtonText, PropButtonIcon }
