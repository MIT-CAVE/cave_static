import { Box, Modal, Typography } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { MdClose } from 'react-icons/md'
import { useDispatch } from 'react-redux'

import { closeMapModal } from '../../../data/local/mapSlice'

import { Select } from '../../compound'

import { withIndex } from '../../../utils'

const styles = {
  modal: {
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    p: 0.5,
    whiteSpace: 'nowrap',
  },
  paper: {
    position: 'absolute',
    right: '64px',
    bottom: '72px',
    maxWidth: 250,
    p: (theme) => theme.spacing(2, 4, 3),
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    color: 'text.primary',
    bgcolor: 'background.paper',
  },

  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}

const SimpleModalOptions = ({
  title,
  options,
  placeholder,
  onSelect,
  mapId,
}) => {
  const dispatch = useDispatch()

  return (
    <Modal
      sx={styles.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => dispatch(closeMapModal(mapId))}
    >
      <Box sx={styles.paper}>
        <Box sx={styles.flexSpaceBetween}>
          <Typography id="viewports-pad-title" variant="h5" sx={styles.title}>
            {title}
          </Typography>
          <MdClose
            cursor="pointer"
            onClick={() => dispatch(closeMapModal(mapId))}
          />
        </Box>

        <Select
          value=""
          optionsList={R.map(({ id, name, icon }) => ({
            label: name,
            value: id,
            iconName: icon,
          }))(withIndex(options))}
          {...{ placeholder, onSelect }}
        />
      </Box>
    </Modal>
  )
}
SimpleModalOptions.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.object,
  onSelect: PropTypes.func,
  mapId: PropTypes.string,
}

export default SimpleModalOptions
