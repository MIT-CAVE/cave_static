import * as R from 'ramda'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectCharts,
  selectMapData,
  selectPageLayout,
} from '../../../data/selectors'
import { useMenu, useMutateStateWithSync } from '../../../utils/hooks'

import { getNumActiveFilters } from '../../../utils'

const useMapFilter = ({
  mapId,
  group,
  filtersPath,
  featureTypeProps,
  filters,
}) => {
  const mapData = useSelector(selectMapData)
  const charts = useSelector(selectCharts)
  const pageLayout = useSelector(selectPageLayout)

  const { anchorEl, handleOpenMenu, handleCloseMenu } = useMenu()

  const filterableProps = useMemo(
    () =>
      R.reject(
        R.whereAny({
          type: R.equals('head'), // Drop layout props
          allowFiltering: R.equals(false),
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
            R.always({
              colorOptions: R.pluck('color')(
                featureTypeProps[key]?.options ?? []
              ),
            }),
          ],
          // Others if needed
        ])(value)
      )(filterableProps),
    [featureTypeProps, filterableProps]
  )

  const numActiveFilters = useMemo(
    () => getNumActiveFilters(filters),
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
            pageLayout.indexOf(mapId)
          ]
        } Chart`
  }, [charts, mapData, mapId, pageLayout])

  const handleSaveFilters = useMutateStateWithSync(
    (newFilters) => ({ path: filtersPath, value: newFilters }),
    [filtersPath]
  )

  return {
    labelStart,
    isFilterDisabled,
    numActiveFilters,
    filterableProps,
    filterableExtraProps,
    filterOpen: Boolean(anchorEl),
    handleOpenFilter: handleOpenMenu,
    handleCloseFilter: handleCloseMenu,
    handleSaveFilters,
  }
}

export default useMapFilter
