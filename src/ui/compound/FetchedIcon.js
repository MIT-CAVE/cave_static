import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { BiSolidSquareRounded } from 'react-icons/bi'
import { useSelector } from 'react-redux'

import { selectSettingsIconUrl } from '../../data/selectors'

import { fetchIcon, addExtraProps, removeExtraProps } from '../../utils'

const FetchedIcon = ({ iconName = 'md/MdDownloading', ...props }) => {
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [icon, setIcon] = useState(<BiSolidSquareRounded />)
  useEffect(() => {
    fetchIcon(iconName, iconUrl).then((item) => setIcon(item))
  }, [iconName, iconUrl])
  return removeExtraProps(addExtraProps(icon, props), ['$$typeof', 'type'])
}
FetchedIcon.propTypes = { iconName: PropTypes.string }

export default FetchedIcon
