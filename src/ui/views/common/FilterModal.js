import { Tabs, Tab } from '@mui/material'
import * as R from 'ramda'
import { useCallback, useMemo, useState } from 'react'
import { useSelector } from 'react-redux'

import { DataGridModal } from './BaseModal'
import GridFilter from './GridFilter'
import GroupsFilter from './GroupsFilter'

import {
  selectCurrentPage,
  selectFilterableStats,
  selectChartFiltersById,
} from '../../../data/selectors'
import { useMutateStateWithSync } from '../../../utils/hooks'

import { getNumActiveFilters } from '../../../utils'

const FilterModal = ({ index, label, labelExtra, onClose }) => {
  const [filterTab, setFilterTab] = useState('stats')

  const currentPage = useSelector(selectCurrentPage)
  const filters = useSelector((state) => selectChartFiltersById(state, index))

  const [statFilters, groupingFilters] = useMemo(
    () =>
      R.partition(
        R.propSatisfies(R.either(R.isNil, R.equals('stat')), 'format')
      )(filters),
    [filters]
  )

  const filterableStats = useSelector(selectFilterableStats)

  const handleChangeTab = useCallback(() => {
    setFilterTab(
      R.ifElse(R.equals('stats'), R.always('groups'), R.always('stats'))
    )
  }, [])

  const numActiveStatFilters = useMemo(
    () => getNumActiveFilters(statFilters),
    [statFilters]
  )
  const numGroupingFilters = useMemo(
    () =>
      R.pipe(
        R.filter(R.propEq('exc', 'option')),
        R.chain(R.pipe(R.prop('value'), R.length)),
        R.sum
      )(groupingFilters),
    [groupingFilters]
  )

  const handleSaveFilters = useMutateStateWithSync(
    (filters) => ({
      path: ['pages', 'data', currentPage, 'charts', index, 'filters'],
      value: filters,
    }),
    [currentPage, index]
  )

  const saveFilters = useCallback(
    (otherFilters, filters) => {
      handleSaveFilters(R.concat(filters)(otherFilters))
    },
    [handleSaveFilters]
  )

  const handleSaveStatFilters = useCallback(
    (filters) => saveFilters(filters, groupingFilters),
    [groupingFilters, saveFilters]
  )

  const handleSaveGroupFilters = useCallback(
    (filters) => saveFilters(filters, statFilters),
    [statFilters, saveFilters]
  )

  return (
    <DataGridModal open={index != null} {...{ label, labelExtra, onClose }}>
      <Tabs variant="fullWidth" value={filterTab} onChange={handleChangeTab}>
        <Tab
          value="stats"
          label={`Statistics${
            numActiveStatFilters > 0 ? ` (${numActiveStatFilters})` : ''
          }`}
        />
        <Tab
          value="groups"
          label={`Groups${
            numGroupingFilters > 0 ? ` (${numGroupingFilters})` : ''
          }`}
        />
      </Tabs>
      {filterTab === 'stats' ? (
        <GridFilter
          defaultFilters={statFilters}
          sourceHeaderName="Statistic"
          filterables={filterableStats}
          onSave={handleSaveStatFilters}
        />
      ) : filterTab === 'groups' ? (
        <GroupsFilter
          defaultFilters={groupingFilters}
          onSave={handleSaveGroupFilters}
        />
      ) : null}
    </DataGridModal>
  )
}

export default FilterModal
