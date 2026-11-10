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
import { useCallback, useContext, useMemo } from 'react'
import { MdGpsFixed, MdMap } from 'react-icons/md'
import { PiPerspective } from 'react-icons/pi'
import { useSelector, useDispatch } from 'react-redux'

import { MapContext } from './useMapApi'

import { closeMapModal, viewportUpdate } from '../../../data/local/mapSlice'
import {
  selectOptionalViewportsFunc,
  selectMapModal,
  selectMapStyleOptions,
  selectMapProjectionOptionsFunc,
  selectMapRichText,
} from '../../../data/selectors'
import { useMutateStateWithSync, useRichText } from '../../../utils/hooks'

import { FetchedIcon, RichLabel } from '../../compound'

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
  richText,
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
            <ListItemText
              primary={<RichLabel text={name} rich={richText === true} />}
            />
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
  const mapStyleOptions = useSelector(selectMapStyleOptions)
  const getMapProjectionOptions = useSelector(selectMapProjectionOptionsFunc)
  // The `richText` of the map is the root of the names of its viewports,
  // styles and projections
  const richText = useRichText(
    useSelector((state) => selectMapRichText(state, mapId))
  )
  const dispatch = useDispatch()

  const optionalViewports = useMemo(
    () => getOptionalViewports(mapId),
    [getOptionalViewports, mapId]
  )

  const projectionOptions = useMemo(
    () => getMapProjectionOptions(mapId),
    [getMapProjectionOptions, mapId]
  )

  const handleCloseModal = useCallback(
    () => dispatch(closeMapModal({ sync: false })),
    [dispatch]
  )

  const handleSelectMapViewports = useCallback(
    (value) => {
      const viewport = R.pipe(
        R.prop(value),
        // `id` is not necessary here, since that is only
        // added by `withIndex` as a helper property
        R.omit(['name', 'icon'])
      )(optionalViewports)
      dispatch(viewportUpdate({ viewport, mapId, sync: false }))
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

  const handleSelectProjection = useMutateStateWithSync(
    (projection) => {
      handleCloseModal()
      return {
        path: ['maps', 'data', mapId, 'currentProjection'],
        value: projection,
      }
    },
    [dispatch, handleCloseModal, mapId]
  )

  if (!mapModal.isOpen || mapId !== R.pathOr('', ['data', 'mapId'])(mapModal))
    return null

  const feature = R.path(['data', 'feature'])(mapModal)

  return feature === 'viewports' ? (
    <ListModal
      title="Map Viewports"
      richText={richText}
      options={optionalViewports}
      defaultIcon={MdGpsFixed}
      onSelect={handleSelectMapViewports}
      onClose={handleCloseModal}
    />
  ) : feature === 'mapStyles' ? (
    <ListModal
      title="Map Styles"
      richText={richText}
      defaultIcon={MdMap}
      options={mapStyleOptions}
      onSelect={handleSelectMapStyleId}
      onClose={handleCloseModal}
    />
  ) : feature === 'mapProjections' ? (
    <ListModal
      title="Map Projections"
      richText={richText}
      defaultIcon={PiPerspective}
      options={projectionOptions}
      onSelect={handleSelectProjection}
      onClose={handleCloseModal}
    />
  ) : null
}

export default MapModal
