import { Box, Modal, Typography } from '@mui/material'
import { memo } from 'react'
import { MdClose } from 'react-icons/md'
import { useSelector, useDispatch } from 'react-redux'

import { closeError } from '../../../data/local/map/mapModalSlice'
import { selectMapModal } from '../../../data/selectors'

const styles = {
  modal: {
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: '400px',
    px: 4,
    py: 2,
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    color: 'text.primary',
    bgcolor: 'background.paper',
    boxShadow: 5,
  },
  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  largeFont: {
    fontSize: '30px',
  },
}

const ErrorPad = () => {
  const mapModal = useSelector(selectMapModal)
  const dispatch = useDispatch()
  if (!mapModal.isError) return null

  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
    >
      <Box sx={styles.paper}>
        <Box sx={styles.flexSpaceBetween}>
          <Typography
            id="server-modal-title"
            variant="h2"
            sx={styles.largeFont}
          >
            {'Error:'}
          </Typography>
          <MdClose cursor="pointer" onClick={() => dispatch(closeError())} />
        </Box>
        <div id="server-modal-description">{mapModal.errorText}</div>
      </Box>
    </Modal>
  )
}

export default memo(ErrorPad)
