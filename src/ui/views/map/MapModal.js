import {
  Modal,
  Typography,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Box,
} from '@mui/material'
import * as R from 'ramda'
import { memo, useCallback, useContext, useMemo } from 'react'
import { MdGpsFixed, MdMap } from 'react-icons/md'
import { useSelector, useDispatch } from 'react-redux'

import SimpleModalOptions from './SimpleModalOptions'
import { MapContext } from './useMapApi'

import { closeMapModal, viewportUpdate } from '../../../data/local/mapSlice'
import { timeSelection } from '../../../data/local/settingsSlice'
import {
  selectOptionalViewportsFunc,
  selectMapModal,
  selectCurrentTimeUnits,
  selectCurrentTimeLength,
  selectMapStyleOptions,
} from '../../../data/selectors'
import { useMutateStateWithSync } from '../../../utils/hooks'

import { FetchedIcon } from '../../compound'

import { withIndex } from '../../../utils'

const styles = {
  modal: {
    position: 'fixed',
    display: 'flex',
    p: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    backgroundColor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 3),
    color: 'text.primary',
  },
  title: {
    p: 0.5,
    whiteSpace: 'nowrap',
  },
  listPaper: {
    position: 'absolute',
    right: '64px',
    bottom: '72px',
    width: '280px',
    maxHeight: 'calc(100% - 100px)',
    overflowY: 'auto',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 2, 1),
    color: 'text.primary',
  },
  flexSpaceBetween: {
    display: 'flex',
    justifyContent: 'space-between',
  },
}

const ListModal = ({
  title,
  options,
  defaultIcon: DefaultIcon,
  onClose,
  onSelect,
}) => (
  <Modal
    open
    disablePortal
    disableAutoFocus
    disableEnforceFocus
    sx={styles.modal}
    {...{ onClose }}
  >
    <Box sx={styles.listPaper}>
      <Box sx={styles.flexSpaceBetween}>
        <Typography id="viewports-pad-title" variant="h5" sx={styles.title}>
          {title}
        </Typography>
      </Box>
      <List>
        {withIndex(options).map(({ id, name, icon }) => (
          <ListItemButton key={id} onClick={() => onSelect(id)}>
            <ListItemAvatar>
              <Avatar>
                {icon ? <FetchedIcon iconName={icon} /> : <DefaultIcon />}
              </Avatar>
            </ListItemAvatar>
            <ListItemText primary={name} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  </Modal>
)

const MapModal = () => {
  const { mapId } = useContext(MapContext)

  const mapModal = useSelector(selectMapModal)
  const getOptionalViewports = useSelector(selectOptionalViewportsFunc)
  const timeUnits = useSelector(selectCurrentTimeUnits)
  const timeLength = useSelector(selectCurrentTimeLength)
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const dispatch = useDispatch()

  const timeOptions = useMemo(
    () =>
      R.pipe(
        R.add(1),
        R.range(1),
        R.reduce((acc, value) => R.assoc(value, value)(acc), {}),
        R.map((value) => ({ name: value, icon: 'md/MdAvTimer', order: value }))
      )(timeLength),
    [timeLength]
  )

  const optionalViewports = useMemo(
    () => getOptionalViewports(mapId),
    [getOptionalViewports, mapId]
  )

  const handleCloseModal = useCallback(
    () => dispatch(closeMapModal(mapId)),
    [dispatch, mapId]
  )

  const handleSelectMapViewports = useCallback(
    (value) => {
      const viewport = R.pipe(
        R.prop(value),
        // `id` is not necessary here, since that is only
        // added by `withIndex` as a helper property
        R.omit(['name', 'icon'])
      )(optionalViewports)
      dispatch(viewportUpdate({ viewport, mapId }))
      handleCloseModal()
    },
    [dispatch, handleCloseModal, mapId, optionalViewports]
  )

  const handleSelectMapStyleId = useMutateStateWithSync(
    (mapStyleId) => {
      handleCloseModal()
      return {
        path: ['maps', 'data', mapId, 'currentStyle'],
        value: mapStyleId,
      }
    },
    [dispatch, handleCloseModal, mapId]
  )

  const handleSelectTime = useCallback(
    (value) => {
      dispatch(timeSelection(value - 1))
      handleCloseModal()
    },
    [dispatch, handleCloseModal]
  )

  if (!mapModal.isOpen || mapId !== R.pathOr('', ['data', 'mapId'])(mapModal))
    return null

  const feature = R.path(['data', 'feature'])(mapModal)

  return feature === 'viewports' ? (
    <ListModal
      title="Map Viewports"
      options={optionalViewports}
      defaultIcon={MdGpsFixed}
      onSelect={handleSelectMapViewports}
      onClose={handleCloseModal}
    />
  ) : feature === 'mapStyles' ? (
    <ListModal
      title="Map Styles"
      placeholder="Choose a map style..."
      defaultIcon={MdMap}
      options={mapStyleOptions}
      onSelect={handleSelectMapStyleId}
      onClose={handleCloseModal}
    />
  ) : feature === 'setTime' ? (
    (<SimpleModalOptions
      title={`Set ${timeUnits}`}
      placeholder={`Choose a ${timeUnits}`}
      options={timeOptions}
      onSelect={handleSelectTime}
    />)(feature)
  ) : null
}

export default memo(MapModal)
