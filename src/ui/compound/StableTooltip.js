import { ClickAwayListener, Tooltip } from '@mui/material'
import { useState } from 'react'

const StableTooltip = (props) => {
  const [open, setOpen] = useState(false)

  const toggle = () => {
    setOpen(!open)
  }

  const preventPropagation = (e) => e.stopPropagation()

  if (props.enabled === false) return props.children
  return (
    <ClickAwayListener
      onClickAway={() => {
        setOpen(false)
      }}
    >
      <Tooltip
        title={
          <div onTouchEnd={preventPropagation} onClick={preventPropagation}>
            {props.title}
          </div>
        }
        disableHoverListener
        onClick={toggle}
        open={open}
      >
        {props.children}
      </Tooltip>
    </ClickAwayListener>
  )
}

export default StableTooltip
