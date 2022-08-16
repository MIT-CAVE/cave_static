/** @jsxImportSource @emotion/react */
import { Modal } from '@mui/material'
import { makeStyles } from '@mui/styles'
import { memo } from 'react'
import { MdClose } from 'react-icons/md'
import { useSelector, useDispatch } from 'react-redux'

import { closeError } from '../../../data/local/map/mapModalSlice'
import { selectMapModal } from '../../../data/selectors'

const useStyles = makeStyles((theme) => ({
  root: {
    height: '100%',
    flexGrow: 1,
    minWidth: 300,
    transform: 'translateZ(0)',
    // The position fixed scoping doesn't work in IE 11.
    // Disable this demo to preserve the others.
    '@media all and (-ms-high-contrast: none)': {
      display: 'none',
    },
  },
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    width: 400,
    border: `1px solid ${theme.palette.text.secondary}`,
    borderRadius: theme.shape.borderRadius,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
    color: theme.palette.text.primary,
  },
}))

const localCss = {
  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
  largeFont: {
    fontSize: '30px',
  },
}

const ErrorPad = () => {
  const classes = useStyles()
  const mapModal = useSelector(selectMapModal)
  const dispatch = useDispatch()
  if (!mapModal.isError) return null

  return (
    <Modal
      className={classes.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
    >
      <div
        className={classes.paper}
        css={{
          width: '400px',
        }}
      >
        <div css={localCss.flexSpaceBetween}>
          <h2 id="server-modal-title" css={localCss.largeFont}>
            {'Error:'}
          </h2>
          <MdClose cursor={'pointer'} onClick={() => dispatch(closeError())} />
        </div>
        <div id="server-modal-description">{mapModal.errorText}</div>
      </div>
    </Modal>
  )
}

export default memo(ErrorPad)
