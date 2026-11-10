import { Card, Stack } from '@mui/material'
import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import {
  selectAnyGlobalOutputData,
  selectAnyGroupedOutputData,
  selectAnyMapData,
  selectChartById,
  selectCurrentPage,
} from '../../../data/selectors'
import { CHART_DEFAULTS } from '../../../utils/constants'
import { useMutateStateWithSync } from '../../../utils/hooks'
import GlobalOutputsToolbar from '../dashboard/GlobalOutputsToolbar'
import GroupedOutputsToolbar from '../dashboard/GroupedOutputsToolbar'
import MapToolbar from '../dashboard/MapToolbar'

import { Select, TextInput } from '../../compound'

const styles = {
  // Title and viz type split the row 3:2 (60%/40%); viz type fills it alone on map
  vizType: { flex: 2, minWidth: 'max-content' },
  // Match the height and square corners of the neighboring viz type `Select`
  titleInput: {
    flex: 3,
    minWidth: 0,
    '& .MuiOutlinedInput-root': {
      height: '100%',
      borderRadius: 0,
    },
  },
  content: {
    padding: 1,
    height: '100%',
  },
  modalSlots: {
    paper: {
      sx: {
        width: '1200px',
        height: '900px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      },
    },
  },
}

const ChartToolsModal = ({ index, label, labelExtra, onClose }) => {
  const currentPage = useSelector(selectCurrentPage)
  const chartObj = useSelector((state) => selectChartById(state, index))
  const anyGlobalOutputData = useSelector(selectAnyGlobalOutputData)
  const anyMapData = useSelector(selectAnyMapData)
  const anyGroupedOutputData = useSelector(selectAnyGroupedOutputData)

  const vizTypeOptions = useMemo(
    () =>
      R.pipe(
        R.when(
          R.always(anyGroupedOutputData),
          R.append({
            label: 'Grouped Outputs',
            value: 'groupedOutput',
            iconName: 'md/MdMultilineChart',
          })
        ),
        R.when(
          R.always(anyGlobalOutputData),
          R.append({
            label: 'Global Outputs',
            value: 'globalOutput',
            iconName: 'md/MdSpeed',
          })
        ),
        R.when(
          R.always(anyMapData),
          R.append({
            label: 'Maps',
            value: 'map',
            iconName: 'fa/FaMapMarked',
          })
        )
      )([]),
    [anyGlobalOutputData, anyGroupedOutputData, anyMapData]
  )

  const vizType =
    vizTypeOptions.find((opt) => opt.value === chartObj?.type)?.value ??
    vizTypeOptions[0]?.value ??
    ''
  const showTitle = vizType !== 'map'
  const handleSelectVizType = useMutateStateWithSync(
    (value) => ({
      path: ['pages', 'data', currentPage, 'charts', index],
      value: R.pipe(
        R.when(R.always(value === 'map'), R.dissoc('chartType')),
        R.assoc('type', value),
        R.when(
          R.always(R.isNotNil(chartObj?.title)),
          R.assoc('title', chartObj?.title)
        )
      )(CHART_DEFAULTS),
    }),
    [currentPage, index, chartObj?.title]
  )

  const handleChangeTitle = useMutateStateWithSync(
    (value) => ({
      path: ['pages', 'data', currentPage, 'charts', index, 'title'],
      value,
    }),
    [currentPage, index]
  )

  return (
    <DataGridModal
      open={index != null}
      slotProps={styles.modalSlots}
      {...{ label, labelExtra, onClose }}
    >
      <Stack direction="row" spacing={2}>
        <Select
          value={vizType}
          optionsList={vizTypeOptions}
          slotProps={{ formControl: { sx: styles.vizType } }}
          onSelect={handleSelectVizType}
        />
        {showTitle && (
          <TextInput
            placeholder="Chart title"
            value={chartObj?.title ?? ''}
            sx={styles.titleInput}
            slotProps={{ htmlInput: { 'aria-label': 'Title' } }}
            onClickAway={handleChangeTitle}
          />
        )}
      </Stack>
      <Card sx={styles.content}>
        {index != null &&
          (vizType === 'groupedOutput' ? (
            <GroupedOutputsToolbar {...{ index }} />
          ) : vizType === 'globalOutput' ? (
            <GlobalOutputsToolbar {...{ index }} />
          ) : vizType === 'map' ? (
            <MapToolbar {...{ index }} />
          ) : null)}
      </Card>
    </DataGridModal>
  )
}

export default ChartToolsModal
