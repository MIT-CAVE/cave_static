import * as R from 'ramda'
import { useCallback, useMemo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectCharts,
  selectMapData,
  selectSync,
} from '../../../data/selectors'
import { useFilter } from '../../../utils/hooks'

import { includesPath } from '../../../utils'

const useMapFilter = ({
  mapId,
  group,
  colorByOptions,
  filtersPath,
  featureTypeProps,
  filters,
}) => {
  const mapData = useSelector(selectMapData)
  const charts = useSelector(selectCharts)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const { filterOpen, handleOpenFilter, handleCloseFilter } = useFilter()

  const filterableProps = useMemo(
    () =>
      R.reject(
        R.whereAny({
          type: R.equals('head'), // Drop layout props
          filterable: R.equals('false'),
        })
      )(featureTypeProps),
    [featureTypeProps]
  )

  const filterableExtraProps = useMemo(
    () =>
      R.mapObjIndexed((value, key) =>
        // eslint-disable-next-line ramda/cond-simplification
        R.cond([
          [
            R.propEq('selector', 'type'),
            R.always({ colorByOptions: colorByOptions[key] }),
          ],
          // Others if needed
        ])(value)
      )(filterableProps),
    [colorByOptions, filterableProps]
  )

  const numActiveFilters = useMemo(
    () => R.count(R.propEq('rule', 'type'))(filters),
    [filters]
  )

  const isFilterDisabled = useMemo(
    () => R.isEmpty(filterableProps) || group,
    [filterableProps, group]
  )

  const labelStart = useMemo(() => {
    const chartsArr = R.values(charts)
    const isMaximized = R.any(R.propEq(true, 'maximized'))(chartsArr)
    if (isMaximized) return

    const mapIndices = R.addIndex(R.reduce)(
      (acc, value, index) =>
        R.when(R.always(R.propEq(mapId, 'mapId')(value)), R.append(index))(acc),
      []
    )(chartsArr)
    return mapIndices.length > 1
      ? R.pathOr(mapId, [mapId, 'name'])(mapData)
      : `${
          ['Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'][
            mapIndices[0]
          ]
        } Chart`
  }, [charts, mapData, mapId])

  const handleSaveFilters = useCallback(
    (newFilters) => {
      dispatch(
        mutateLocal({
          path: filtersPath,
          value: newFilters,
          sync: !includesPath(Object.values(sync), filtersPath),
        })
      )
    },
    [dispatch, filtersPath, sync]
  )

  return {
    labelStart,
    isFilterDisabled,
    numActiveFilters,
    filterOpen,
    filterableProps,
    filterableExtraProps,
    handleOpenFilter,
    handleCloseFilter,
    handleSaveFilters,
  }
}

export default useMapFilter
