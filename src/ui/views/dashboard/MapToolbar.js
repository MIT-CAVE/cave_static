import * as R from 'ramda'
import { memo } from 'react'
import { useDispatch, useSelector } from 'react-redux'

import { mutateLocal } from '../../../data/local'
import {
  selectSync,
  selectCurrentPage,
  selectMapData,
} from '../../../data/selectors'

import { HeaderSelectWrapper, Select } from '../../compound'

import { getFreeName, includesPath } from '../../../utils'

const MapToolbar = memo(({ view, index }) => {
  const dispatch = useDispatch()
  const currentPage = useSelector(selectCurrentPage)

  const sync = useSelector(selectSync)
  const maps = useSelector(selectMapData)

  const path = ['pages', 'data', currentPage, 'pageLayout', index]

  const availableValue = R.pipe(
    R.propOr('', 'mapId'),
    R.unless(R.has(R.__, maps), R.always(''))
  )(view)
  return (
    <>
      <HeaderSelectWrapper>
        <Select
          value={availableValue}
          placeholder={'Select A Map'}
          getLabel={(mapId) => R.pathOr(mapId, [mapId, 'name'], maps)}
          optionsList={R.pipe(
            R.keys,
            R.map((k) =>
              R.assoc('value', k, {
                subOptions: [
                  R.pathOr(false, [k, 'duplicate'], maps)
                    ? {
                        iconName: 'md/MdDelete',
                        onClick: (key) => {
                          dispatch(
                            mutateLocal({
                              path: ['maps', 'data'],
                              sync: !includesPath(R.values(sync), [
                                'maps',
                                'data',
                              ]),
                              value: R.dissoc(key, maps),
                            })
                          )
                        },
                      }
                    : {
                        iconName: 'md/MdCopyAll',
                        onClick: (value) => {
                          const key = getFreeName(value, R.keys(maps))
                          const name = getFreeName(
                            R.pathOr(value, [value, 'name'], maps),
                            R.values(
                              R.mapObjIndexed(
                                (val, key) => R.propOr(key, 'name', val),
                                maps
                              )
                            )
                          )
                          dispatch(
                            mutateLocal({
                              path: ['maps', 'data', key],
                              sync: !includesPath(R.values(sync), [
                                'maps',
                                'data',
                                key,
                              ]),
                              value: R.pipe(
                                R.assoc('duplicate', true),
                                R.assoc('name', name)
                              )(maps[value]),
                            })
                          )
                        },
                      },
                ],
              })
            )
          )(maps)}
          onSelect={(value) => {
            dispatch(
              mutateLocal({
                path,
                sync: !includesPath(R.values(sync), path),
                value: R.assoc('mapId', value, view),
              })
            )
          }}
        />
      </HeaderSelectWrapper>
    </>
  )
})

export default MapToolbar
