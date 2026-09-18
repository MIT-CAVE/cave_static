import { AppBar, Divider, Toolbar } from '@mui/material'
import { Fragment } from 'react'
import { useSelector } from 'react-redux'

import GlobalOutputsDockedSection from './GlobalOutputsDockedSection'
import SessionDockedSection from './SessionDockedSection'
import TimeDockedSection from './TimeDockedSection'

import {
  selectAnyGlobalOutputQuickView,
  selectMergedDraggables,
} from '../../data/selectors'
import { draggableId } from '../../utils/enums'

const styles = {
  root: {
    flex: '0 0 auto',
    minWidth: 0,
    border: '1px outset rgb(255 255 255 / .12)',
    zIndex: 1300,
    bgcolor: 'rgb(0 0 0 / .8)',
    ':hover': { bgcolor: '#000' },
  },
  toolbar: {
    bgcolor: 'rgb(0 0 0 / .15)',
    gap: 1,
    py: 1,
  },
  divider: {
    borderColor: 'rgb(255 255 255 / .12)',
    my: 1,
  },
}

const DockBar = () => {
  const draggables = useSelector(selectMergedDraggables)
  const anyGlobalOutputQuickView = useSelector(selectAnyGlobalOutputQuickView)

  const sessionDocked =
    draggables[draggableId.SESSION]?.open &&
    draggables[draggableId.SESSION]?.docked
  const timeDocked =
    draggables[draggableId.TIME]?.open && draggables[draggableId.TIME]?.docked
  const globalOutputsDocked =
    anyGlobalOutputQuickView &&
    draggables[draggableId.GLOBAL_OUTPUTS]?.open &&
    draggables[draggableId.GLOBAL_OUTPUTS]?.docked

  const sections = [
    sessionDocked && { key: 'session', Section: SessionDockedSection },
    timeDocked && { key: 'time', Section: TimeDockedSection },
    globalOutputsDocked && {
      key: 'globalOutputs',
      Section: GlobalOutputsDockedSection,
    },
  ].filter(Boolean)

  return (
    <AppBar position="static" sx={styles.root}>
      <Toolbar sx={styles.toolbar}>
        {sections.map(({ key, Section }, index) => (
          <Fragment key={key}>
            {index > 0 && (
              <Divider orientation="vertical" flexItem sx={styles.divider} />
            )}
            <Section />
          </Fragment>
        ))}
      </Toolbar>
    </AppBar>
  )
}

export default DockBar
