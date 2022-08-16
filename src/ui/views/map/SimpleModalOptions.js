/** @jsxImportSource @emotion/react */
import { Modal, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { MdClose } from 'react-icons/md'
import { useDispatch } from 'react-redux'

import { closeMapModal } from '../../../data/local/map/mapModalSlice'

import { Select, FetchedIcon } from '../../compound'

import { customSort } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    padding: theme.spacing(1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    padding: theme.spacing(0.5),
    whiteSpace: 'nowrap',
  },
  paper: {
    position: 'absolute',
    right: '64px',
    bottom: '72px',
    maxWidth: 250,
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
}

const SimpleModalOptions = ({ title, options, placeholder, onSelect }) => {
  const classes = useStyles()
  const dispatch = useDispatch()
  return (
    <Modal
      className={classes.modal}
      disablePortal
      disableEnforceFocus
      disableAutoFocus
      open
      onClose={() => dispatch(closeMapModal())}
    >
      <div className={classes.paper}>
        <div css={localCss.flexSpaceBetween}>
          <Typography
            id="viewports-pad-title"
            variant="h5"
            className={classes.title}
          >
            {title}
          </Typography>
          <MdClose cursor="pointer" onClick={() => dispatch(closeMapModal())} />
        </div>

        <Select
          value=""
          optionsList={R.map(({ id, name, icon }) => {
            const IconClass = () => <FetchedIcon iconName={icon} />
            return {
              label: name,
              value: id,
              iconClass: IconClass,
            }
          })(customSort(options))}
          {...{ placeholder, onSelect }}
        />
      </div>
    </Modal>
  )
}
SimpleModalOptions.propTypes = {
  title: PropTypes.string,
  placeholder: PropTypes.string,
  options: PropTypes.object,
  onSelect: PropTypes.func,
}

export default SimpleModalOptions
