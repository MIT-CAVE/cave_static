import '../../../App.css'
import { ClickAwayListener, Box } from '@mui/material'
import * as R from 'ramda'
import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import AppBar from './AppBar'
import renderAppPane from './Pane'

import { mutateLocal } from '../../../data/local'
import {
  selectLeftAppBarData,
  selectLeftAppBarDisplay,
  selectLeftGroupedAppBar,
  selectLeftOpenPane,
  selectLeftOpenPanesData,
  selectLeftPinPane,
  selectMirrorMode,
  selectRightAppBarData,
  selectRightAppBarDisplay,
  selectRightGroupedAppBar,
  selectRightOpenPane,
  selectRightOpenPanesData,
  selectRightPinPane,
  selectSync,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'
import { paneId } from '../../../utils/enums'

import { includesPath } from '../../../utils'

const styles = {
  pane: {
    display: 'flex',
    position: 'absolute',
    height: '100vh',
    top: 0,
  },
}

const LeftAppBar = () => {
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const leftGroupedAppBar = useSelector(selectLeftGroupedAppBar)
  const leftOpen = useSelector(selectLeftOpenPane)
  const leftPin = useSelector(selectLeftPinPane)
  const rightGroupedAppBar = useSelector(selectRightGroupedAppBar)
  const mirrorMode = useSelector(selectMirrorMode)
  return (
    <>
      {leftBar && (
        <AppBar
          appBar={mirrorMode ? rightGroupedAppBar : leftGroupedAppBar}
          open={leftOpen}
          pin={leftPin}
          side="left"
          source={mirrorMode ? 'right' : 'left'}
        />
      )}
    </>
  )
}

const RightAppBar = () => {
  const rightBar = useSelector(selectRightAppBarDisplay)
  const rightGroupedAppBar = useSelector(selectRightGroupedAppBar)
  const rightOpen = useSelector(selectRightOpenPane)
  const rightPin = useSelector(selectRightPinPane)
  const leftGroupedAppBar = useSelector(selectLeftGroupedAppBar)
  const mirrorMode = useSelector(selectMirrorMode)
  return (
    <>
      {rightBar && (
        <AppBar
          appBar={mirrorMode ? leftGroupedAppBar : rightGroupedAppBar}
          open={rightOpen}
          pin={rightPin}
          side="right"
          source={mirrorMode ? 'left' : 'right'}
        />
      )}
    </>
  )
}

const Panes = ({ sessionCard, setSessionCard }) => {
  const leftAppBarData = useSelector(selectLeftAppBarData)
  const leftBar = useSelector(selectLeftAppBarDisplay)
  const leftOpen = useSelector(selectLeftOpenPane)
  const leftOpenPanesData = useSelector(selectLeftOpenPanesData)
  const leftPin = useSelector(selectLeftPinPane)
  const rightAppBarData = useSelector(selectRightAppBarData)
  const rightBar = useSelector(selectRightAppBarDisplay)
  const rightOpen = useSelector(selectRightOpenPane)
  const rightOpenPanesData = useSelector(selectRightOpenPanesData)
  const rightPin = useSelector(selectRightPinPane)
  const mirrorMode = useSelector(selectMirrorMode)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const leftPane = R.assoc(
    'icon',
    R.path([leftOpen, 'icon'], mirrorMode ? rightAppBarData : leftAppBarData),
    leftOpenPanesData
  )
  const rightPane = R.assoc(
    'icon',
    R.path([rightOpen, 'icon'], mirrorMode ? leftAppBarData : rightAppBarData),
    rightOpenPanesData
  )

  const handlePaneClickAway = useCallback(
    (e) => {
      const xPosition = R.propOr(0, 'x', e)
      const overMin = xPosition > APP_BAR_WIDTH
      const underMax = xPosition < window.innerWidth - APP_BAR_WIDTH
      R.forEach(
        ([side, open, pin, pageClick]) => {
          if (!pin && R.isNotNil(open) && open !== '' && pageClick) {
            dispatch(
              mutateLocal({
                path: ['panes', 'paneState', side],
                value: {},
                sync: !includesPath(R.values(sync), [
                  'panes',
                  'paneState',
                  side,
                ]),
              })
            )
          }
        },
        [
          ['left', leftOpen, leftPin, overMin && (!rightBar || underMax)],
          ['right', rightOpen, rightPin, (!leftBar || overMin) && underMax],
        ]
      )
    },
    [dispatch, sync, leftBar, leftOpen, leftPin, rightBar, rightOpen, rightPin]
  )

  const getPinObj = (side) => {
    return {
      pin: side === 'right' ? rightPin : leftPin,
      onPin: () => {
        dispatch(
          mutateLocal({
            path: ['panes', 'paneState', side, 'pin'],
            value: side === 'right' ? !rightPin : !leftPin,
            sync: !includesPath(R.values(sync), [
              'panes',
              'paneState',
              side,
              'pin',
            ]),
          })
        )
      },
    }
  }

  return (
    <ClickAwayListener onClickAway={handlePaneClickAway}>
      <Box>
        {R.map(
          ([side, open, pane, openPanesData]) => {
            const systemPane = R.propOr(
              {},
              open,
              side === 'left' && mirrorMode
                ? rightAppBarData
                : side === 'left'
                  ? leftAppBarData
                  : mirrorMode
                    ? leftAppBarData
                    : rightAppBarData
            )
            const isSystem =
              systemPane &&
              (systemPane.type === paneId.SESSION ||
                systemPane.type === paneId.APP_SETTINGS)
            return open ? (
              <Box key={side} sx={styles.pane}>
                {renderAppPane({
                  side: side,
                  open: open,
                  pane: isSystem
                    ? R.mergeLeft(
                        {
                          variant: systemPane.type,
                          name:
                            systemPane.type === paneId.SESSION
                              ? 'Sessions'
                              : 'Settings',
                        },
                        systemPane
                      )
                    : pane,
                  openPanesData: openPanesData,
                  sessionCard: sessionCard,
                  toggleSessionCard: (enabled) => setSessionCard(enabled),
                  ...getPinObj(side),
                })}
              </Box>
            ) : (
              []
            )
          },
          [
            ['left', leftOpen, leftPane, leftOpenPanesData],
            ['right', rightOpen, rightPane, rightOpenPanesData],
          ]
        )}
      </Box>
    </ClickAwayListener>
  )
}

export { LeftAppBar, RightAppBar, Panes }
