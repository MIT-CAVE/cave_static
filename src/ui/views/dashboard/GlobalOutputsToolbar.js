import { Box, Button } from '@mui/material'
import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { sendCommand } from '../../../data/data'
import { mutateLocal } from '../../../data/local'
import {
  selectAssociatedData,
  selectSync,
  selectCurrentPage,
  selectMergedKpis,
} from '../../../data/selectors'

import {
  FetchedIcon,
  HeaderSelectWrapper,
  Select,
  SelectMulti,
} from '../../compound'

import {
  withIndex,
  includesPath,
  renameKeys,
  addValuesToProps,
} from '../../../utils'

const GlobalOutputsToolbar = ({ view, index }) => {
  const dispatch = useDispatch()

  const globalOutputs = useSelector(selectAssociatedData)
  const currentPage = useSelector(selectCurrentPage)
  const items = useSelector(selectMergedKpis)
  const props = addValuesToProps(
    R.map(R.assoc('enabled', false))(R.propOr({}, 'props', items)),
    R.propOr({}, 'values', items)
  )
  const sync = useSelector(selectSync)

  const path = ['pages', 'data', currentPage, 'pageLayout', index]

  return (
    <>
      <HeaderSelectWrapper>
        <Select
          value={R.propOr('Bar', 'chart', view)}
          optionsList={[
            {
              label: 'Bar',
              value: 'Bar',
              iconName: 'md/MdBarChart',
            },
            {
              label: 'Line',
              value: 'Line',
              iconName: 'md/MdShowChart',
            },
            // {
            //   label: 'Box Plot',
            //   value: 'Box Plot',
            //   iconName: 'md/MdGraphicEq',
            // },
            {
              label: 'Table',
              value: 'Table',
              iconName: 'md/MdTableChart',
            },
            {
              label: 'Overview',
              value: 'Overview',
              iconName: 'md/MdViewQuilt',
            },
          ]}
          displayIcon
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('chart', value)(view),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
      {view.chart !== 'Overview' && (
        <>
          <HeaderSelectWrapper>
            <SelectMulti
              value={R.propOr([], 'sessions', view)}
              header="Select Sessions"
              optionsList={R.pipe(R.values, R.pluck('name'))(globalOutputs)}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assoc('sessions', value, view),
                  })
                )
              }}
            />
          </HeaderSelectWrapper>
          <HeaderSelectWrapper>
            <SelectMulti
              value={R.propOr([], 'globalOutput', view)}
              header="Select Global Outputs"
              optionsList={R.pipe(
                R.filter(R.prop('value')),
                withIndex,
                R.project(['id', 'name', 'icon']),
                R.map(
                  renameKeys({ id: 'value', name: 'label', icon: 'iconName' })
                )
              )(props)}
              onSelect={(value) => {
                dispatch(
                  mutateLocal({
                    path,
                    sync: !includesPath(R.values(sync), path),
                    value: R.assoc('globalOutput', value, view),
                  })
                )
              }}
            />
          </HeaderSelectWrapper>
          <HeaderSelectWrapper>
            <Button
              sx={{ minWidth: 0 }}
              variant="outlined"
              color="greyscale"
              onClick={() => {
                dispatch(
                  sendCommand({
                    command: 'get_associated_session_data',
                    data: {
                      data_names: ['globalOutputs'],
                    },
                  })
                )
              }}
            >
              <Box
                component="span"
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '40px',
                }}
              >
                <FetchedIcon iconName="md/MdRefresh" size={32} />
              </Box>
            </Button>
          </HeaderSelectWrapper>
        </>
      )}
    </>
  )
}

export default memo(GlobalOutputsToolbar)
