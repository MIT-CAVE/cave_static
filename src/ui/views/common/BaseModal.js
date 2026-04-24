import { Box, Modal, Typography } from '@mui/material'
import { useEffect, useRef } from 'react'

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mx: 'auto',
    p: 1,
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    height: '700px',
    width: '700px',
    maxHeight: '60%',
    maxWidth: '60%',
    p: 2,
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    pt: 2,
  },
  headerExtra: {
    display: 'flex',
    justifyContent: 'center',
    fontWeight: 600,
    mb: 1,
    pb: 2,
  },
}

// TODO: This might replace `GeneralModal` and other modal wrappers
const BaseModal = ({
  open,
  label,
  labelExtra,
  slotProps,
  onClose,
  children,
}) => {
  const {
    root: { sx: sxRoot, ...rootProps } = {},
    paper: { sx: sxPaper, ...paperProps } = {},
  } = slotProps
  const paperRef = useRef(null)
  // By the time `onClose` fires for a backdrop click, native blur has already
  // moved focus off any input, so sample the focus state at mousedown instead.
  const hadFocusedInputRef = useRef(false)
  useEffect(() => {
    const onMouseDown = () => {
      const active = document.activeElement
      hadFocusedInputRef.current = Boolean(
        paperRef.current &&
        active &&
        active.tagName === 'INPUT' &&
        paperRef.current.contains(active)
      )
    }
    document.addEventListener('mousedown', onMouseDown, true)
    return () => document.removeEventListener('mousedown', onMouseDown, true)
  }, [])

  const handleClose = (event, reason) => {
    // Swallow a backdrop click that also blurred an input inside the modal —
    // one click should only exit the input context, not the modal.
    if (reason === 'backdropClick' && hadFocusedInputRef.current) {
      hadFocusedInputRef.current = false
      return
    }
    onClose?.(event, reason)
  }

  return (
    <Modal
      sx={[styles.root, sxRoot]}
      {...{ open, ...rootProps }}
      onClose={handleClose}
    >
      <Box
        ref={paperRef}
        sx={[styles.paper, sxPaper]}
        {...paperProps}
        onClick={(event) => {
          event.stopPropagation()
        }}
      >
        <Typography sx={styles.header} component="span" variant="h5">
          {label}
        </Typography>
        {labelExtra && (
          <Typography sx={styles.headerExtra} component="span" color="primary">
            {labelExtra}
          </Typography>
        )}
        {children}
      </Box>
    </Modal>
  )
}

const DataGridModal = ({ open, slotProps = {}, ...props }) => (
  <BaseModal
    slotProps={{
      root: {
        // Keep the component mounted to avoid losing `apiRef`
        keepMounted: true,
        ...slotProps.root,
      },
      paper: {
        // Preserve `apiRef` using `visibility`
        visibility: open ? 'visible' : 'hidden',
        ...slotProps.paper,
      },
    }}
    {...{ open, ...props }}
  />
)

export { DataGridModal }
export default BaseModal
