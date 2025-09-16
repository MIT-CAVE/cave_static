import '../../../App.css'

import { ClickAwayListener, Box } from '@mui/material'
import * as R from 'ramda'
import { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import renderAppPane from './renderAppPane'

import { mutateLocal } from '../../../data/local'
import {
  selectIsSynced,
  selectLeftAppBarData,
  selectLeftAppBarDisplay,
  selectLeftOpenPane,
  selectLeftOpenPanesData,
  selectLeftPinPane,
  selectMirrorMode,
  selectRightAppBarData,
  selectRightAppBarDisplay,
  selectRightOpenPane,
  selectRightOpenPanesData,
  selectRightPinPane,
  selectVirtualKeyboard,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, PANE_WIDTH } from '../../../utils/constants'

const styles = {
  pane: {
    display: 'flex',
    position: 'absolute',
    height: '100vh',
    top: 0,
  },
}

const Panes = () => {
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
  const isSynced = useSelector(selectIsSynced)
  const virtualKeyboard = useSelector(selectVirtualKeyboard)
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

      const overMin = xPosition > APP_BAR_WIDTH + PANE_WIDTH
      const underMax =
        xPosition < window.innerWidth - (APP_BAR_WIDTH + PANE_WIDTH)
      R.forEach(
        ([side, open, pin, pageClick]) => {
          if (!pin && R.isNotNil(open) && open !== '' && pageClick) {
            // FIXME: Replace with useMutateStateWithSync
            dispatch(
              mutateLocal({
                path: ['panes', 'paneState', side],
                value: {},
                sync: isSynced(['panes', 'paneState', side]),
              })
            )
          }
        },
        [
          [
            'left',
            leftOpen,
            leftPin,
            overMin && (!rightBar || underMax) && !virtualKeyboard.isOpen,
          ],
          [
            'right',
            rightOpen,
            rightPin,
            (!leftBar || overMin) && underMax && !virtualKeyboard.isOpen,
          ],
        ]
      )
    },
    [
      dispatch,
      isSynced,
      leftBar,
      leftOpen,
      leftPin,
      rightBar,
      rightOpen,
      rightPin,
      virtualKeyboard.isOpen,
    ]
  )

  const getPinObj = (side) => {
    return {
      pin: side === 'right' ? rightPin : leftPin,
      onPin: () => {
        // FIXME: Replace with useMutateStateWithSync
        dispatch(
          mutateLocal({
            path: ['panes', 'paneState', side, 'pin'],
            value: side === 'right' ? !rightPin : !leftPin,
            sync: isSynced(['panes', 'paneState', side, 'pin']),
          })
        )
      },
    }
  }

  return (
    <ClickAwayListener onClickAway={handlePaneClickAway}>
      <Box>
        {R.map(
          ([side, open, pane, openPanesData]) =>
            R.isNotEmpty(open) && (
              <Box key={side} sx={styles.pane}>
                {renderAppPane({
                  open,
                  openPanesData,
                  pane,
                  side,
                  ...getPinObj(side),
                })}
              </Box>
            ),
          [
            ['left', leftOpen, leftPane, leftOpenPanesData],
            ['right', rightOpen, rightPane, rightOpenPanesData],
          ]
        )}
      </Box>
    </ClickAwayListener>
  )
}

export default Panes
