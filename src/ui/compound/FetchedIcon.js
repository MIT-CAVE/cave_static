import PropTypes from 'prop-types'
import { useState, useEffect } from 'react'
import { GenIcon } from 'react-icons'
import { BiSolidSquareRounded } from 'react-icons/bi'
import { useSelector } from 'react-redux'

import { selectSettingsIconUrl } from '../../data/selectors'

import { fetchIcon, getCachedIconTree } from '../../utils'

const FetchedIcon = ({ iconName = 'md/MdDownloading', ...props }) => {
  const iconUrl = useSelector(selectSettingsIconUrl)
  const cachedTree = iconName ? getCachedIconTree(iconName, iconUrl) : null
  const [IconComponent, setIconComponent] = useState(() =>
    cachedTree?.tag ? GenIcon(cachedTree) : BiSolidSquareRounded
  )

  useEffect(() => {
    if (!iconName) return
    let active = true
    const currentCached = getCachedIconTree(iconName, iconUrl)
    if (currentCached?.tag) {
      setIconComponent(() => GenIcon(currentCached))
      return
    }
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
