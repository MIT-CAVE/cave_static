import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { BiSolidSquareRounded } from 'react-icons/bi'
import { useSelector } from 'react-redux'

import { selectSettingsIconUrl } from '../../data/selectors'

import { fetchIcon } from '../../utils'

const FetchedIcon = ({ iconName = 'md/MdDownloading', ...props }) => {
  const iconUrl = useSelector(selectSettingsIconUrl)
  const [IconComponent, setIconComponent] = useState(() => BiSolidSquareRounded)
  useEffect(() => {
    let active = true
    fetchIcon(iconName, iconUrl).then((item) => {
      if (active && typeof item === 'function') {
        setIconComponent(() => item)
      }
    })
    return () => {
      active = false
    }
  }, [iconName, iconUrl])
  return <IconComponent {...props} />
}
FetchedIcon.propTypes = { iconName: PropTypes.string }

export default FetchedIcon
