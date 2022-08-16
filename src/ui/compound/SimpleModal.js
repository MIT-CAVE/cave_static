import { Box, Modal, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'

import { closeMapModal } from '../../data/local/map/mapModalSlice'

const styles = {
  modal: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 'auto',
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: 1,
    borderRadius: 1,
    borderColor: 'text.primary',
    boxShadow: 24,
    p: 3,
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  title: {
    p: 0.5,
    mb: 2,
    whiteSpace: 'nowrap',
  },
}

const SimpleModal = ({ title, children, ...props }) => {
  const dispatch = useDispatch()
  return (
    <Modal
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => dispatch(closeMapModal())}
      {...props}
    >
      <Box sx={styles.modal}>
        <Box sx={styles.header}>
          <Typography sx={styles.title} variant="h5">
            {title}
          </Typography>
        </Box>
        <Box sx={{ overflow: 'auto', maxHeight: '80vh', maxWidth: '90vw' }}>
          {children}
        </Box>
      </Box>
    </Modal>
  )
}
SimpleModal.propTypes = {
  title: PropTypes.string,
  children: PropTypes.node,
}

export default SimpleModal
