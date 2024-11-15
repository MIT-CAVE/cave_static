import { Card } from '@mui/material'
import * as R from 'ramda'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'

import { selectSync } from '../../../data/selectors'
import { CHART_DEFAULTS } from '../../../utils/constants'
import { chartVariant } from '../../../utils/enums'
import { useMutateState } from '../../../utils/hooks'
import GlobalOutputsToolbar from '../dashboard/GlobalOutputsToolbar'
import GroupedOutputsToolbar from '../dashboard/GroupedOutputsToolbar'
import MapToolbar from '../dashboard/MapToolbar'

import { Select } from '../../compound'

import { includesPath } from '../../../utils'

const styles = {
  content: {
    marginTop: 2,
    marginBottom: 1,
    padding: 1,
    height: '100%',
    gap: 2,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
  },
}

const ChartToolsModal = ({
  open,
  label,
  labelExtra,
  onClose,
  chartObj,
  index,
  path,
}) => {
  const sync = useSelector(selectSync)

  const handleSelectVizType = useMutateState(
    (value) => {
      return {
        path,
        value: R.pipe(
          value === chartVariant.map ? R.dissoc('chartType') : R.identity,
          R.assoc('type', value)
        )(CHART_DEFAULTS),
        sync: !includesPath(R.values(sync), path),
      }
    },
    [sync, chartObj, path, CHART_DEFAULTS]
  )

  return (
    <DataGridModal {...{ label, labelExtra, open, onClose }}>
      <Select
        value={R.propOr('groupedOutput', 'type')(chartObj)}
        optionsList={[
          {
            label: 'Grouped Outputs',
            value: 'groupedOutput',
            iconName: 'md/MdMultilineChart',
          },
          {
            label: 'Global Outputs',
            value: 'globalOutput',
            iconName: 'md/MdSpeed',
          },
          {
            label: 'Maps',
            value: 'map',
            iconName: 'fa/FaMapMarked',
          },
        ]}
        onSelect={handleSelectVizType}
      />
      <Card sx={styles.content}>
        {R.propOr('groupedOutput', 'type', chartObj) === 'groupedOutput' ? (
          <GroupedOutputsToolbar {...{ chartObj, index }} />
        ) : chartObj.type === 'globalOutput' ? (
          <GlobalOutputsToolbar {...{ chartObj, index }} />
        ) : (
          <MapToolbar {...{ chartObj, index }} />
        )}
      </Card>
    </DataGridModal>
  )
}

export default ChartToolsModal
