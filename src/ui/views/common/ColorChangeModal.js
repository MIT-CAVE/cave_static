import {
  TextField,
  Box,
  FormControl,
  InputLabel,
  Stack,
  Typography,
} from '@mui/material'
import { colord } from 'colord'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'

import BaseModal from './BaseModal'

import { mutateLocal } from '../../../data/local'
import { selectMergedStatGroupings, selectSync } from '../../../data/selectors'
import { colorGen } from '../../../utils/ColorGen'
import { ColorPickerAlt, useColorPicker } from '../../compound/ColorPicker'

import { Select, HelpTooltip } from '../../compound'

import {
  getColorString,
  forceArray,
  getLabelFn,
  includesPath,
} from '../../../utils'

const ColorChangeModal = ({ open, label, labelExtra, onClose, chartObj }) => {
  const [searchText, setSearchText] = useState('')
  const [currentCategoryId, setCurrentCategoryId] = useState(null)
  const [localCategoryColors, setLocalCategoryColors] = useState({})
  const statGroupings = useSelector(selectMergedStatGroupings)
  const sync = useSelector(selectSync)
  const dispatch = useDispatch()

  const categoryOptions = useMemo(
    () =>
      R.pipe(
        R.map(
          R.pipe(
            R.prop('levels'),
            R.mapObjIndexed((level, key) => ({
              label: level.name,
              value: key,
              // iconName: level.icon,
            })),
            R.values
          )
        ),
        R.values,
        R.unnest
      )(statGroupings),
    [statGroupings]
  )

  useEffect(() => {
    if (chartObj.groupingLevel) {
      const categoryId = chartObj.groupingLevel[1]
      setCurrentCategoryId(categoryId)
    }
  }, [chartObj])

  const handleChangeCategory = useCallback((value) => {
    setCurrentCategoryId(value)
  }, [])

  const getCategoryLabel = useCallback(
    (categoryParents, levelCategories, category, index, level) => {
      if (level in categoryParents) {
        const parent = categoryParents[level]
        return `${category} \u279D ${getCategoryLabel(
          categoryParents,
          levelCategories,
          levelCategories[parent][index],
          index,
          parent
        )}`
      } else {
        return `${category}`
      }
    },
    []
  )

  const constructSingleCategoryProperties = useCallback(
    (grouping, parents, levelCategories, coloring) => {
      const result = {}
      for (const [level, categories] of Object.entries(levelCategories)) {
        // If level does not have parents, it does not depend on other levels; same categories can be treated as same labels
        const cleanedCategories = !(level in parents)
          ? new Set(categories)
          : categories
        cleanedCategories.forEach((category, index) => {
          const label = getCategoryLabel(
            parents,
            levelCategories,
            category,
            index,
            level
          )
          const categoryColor =
            category in coloring
              ? colord(coloring[category]).toHslString()
              : colorGen(label)
          result[label] = {
            grouping: grouping,
            level: level,
            lastCategory: category,
            // color: categoryColor, TODO: not needed for now
          }
          setLocalCategoryColors(R.assoc(label, categoryColor))
        })
      }
      return result
    },
    [getCategoryLabel]
  )

  const constructAllCategoryProperties = useCallback(() => {
    const groupingMaps = []
    R.forEach(([groupingLabel, grouping]) => {
      const levelCategories = R.pipe(R.prop('data'), R.omit(['id']))(grouping)
      const parent = R.pipe(
        R.prop('levels'),
        R.pluck('parent'),
        R.reject(R.isNil)
      )(grouping)
      const coloring = R.pipe(
        R.prop('levels'),
        R.pluck('coloring'),
        R.reject(R.isNil),
        R.values,
        R.mergeAll
      )(grouping)
      groupingMaps.push(
        constructSingleCategoryProperties(
          groupingLabel,
          parent,
          levelCategories,
          coloring
        )
      )
    }, R.toPairs(statGroupings))
    return groupingMaps
  }, [constructSingleCategoryProperties, statGroupings])

  const allCategoryProperties = useMemo(
    () => R.mergeAll(constructAllCategoryProperties()),
    [constructAllCategoryProperties]
  )

  const onChangeColor = useCallback(
    (pathTail) => (value) => {
      const path = ['groupedOutputs', 'groupings', ...forceArray(pathTail)]
      dispatch(
        mutateLocal({
          path,
          value,
          sync: !includesPath(R.values(sync), path),
        })
      )
    },
    [dispatch, sync]
  )

  const handleChangeSearchText = useCallback((event) => {
    setSearchText(event.target.value)
  }, [])

  const visibleGroupings = useMemo(() => {
    const containsSearchText = R.pipe(
      R.toString, // Parsing bools safely
      R.toLower,
      R.includes(searchText.toLowerCase())
    )
    const matchedCategories = []
    const findMatchedCategories = (property, label) => {
      const finalCategory = property.lastCategory
      if (
        containsSearchText(finalCategory) &&
        property.level === currentCategoryId
      ) {
        matchedCategories.push(label)
      }
    }
    R.mapObjIndexed(
      (property, label) => findMatchedCategories(property, label),
      allCategoryProperties
    )
    return matchedCategories
  }, [searchText, allCategoryProperties, currentCategoryId])

  const { handleChange: handleChangeRaw } = useColorPicker(onChangeColor)

  const handleChangeFn = useCallback(
    (category) => (value, colorOutputs) => {
      setLocalCategoryColors(R.assoc(category, value))
      const { grouping, level } = allCategoryProperties[category]
      const pathTail = [
        grouping,
        'levels',
        level,
        'coloring',
        allCategoryProperties[category]['lastCategory'],
      ]
      // console.log({value, colorOutputs, category, pathTail, allCategoryProperties, chartObj})
      handleChangeRaw(getColorString(value), colorOutputs, pathTail)
    },
    [handleChangeRaw, allCategoryProperties]
  )

  const getLabel = useCallback(
    (option) => getLabelFn(categoryOptions, option),
    [categoryOptions]
  )

  // console.log({
  //   statGroupings,
  //   categoryOptions,
  //   localCategoryColors,
  //   allCategoryProperties,
  //   visibleGroupings,
  //   chartObj,
  // })

  return (
    <BaseModal
      slotProps={{
        paper: {
          sx: {
            width: '750px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        },
      }}
      {...{ label, labelExtra, open, onClose }}
    >
      <Box sx={{ position: 'absolute', top: 30, right: 20 }}>
        <HelpTooltip
          title="Notes on color changes"
          content="Any color changes are applied to ALL relevant charts. Color changes to same-name categories applies to all categories with shared name."
          size={28}
        />
      </Box>
      <Stack direction="row" spacing={2} sx={{ mr: 1.45 }}>
        <TextField
          placeholder="Search final category level"
          label="Search"
          value={searchText}
          onChange={handleChangeSearchText}
          sx={{ width: '65%' }}
        />
        <FormControl fullWidth sx={{ flex: 1 }}>
          <InputLabel id="category-label">{'Category'}</InputLabel>
          <Select
            id="category"
            labelId="category-label"
            label="Category"
            value={currentCategoryId}
            optionsList={categoryOptions}
            getLabel={getLabel}
            onSelect={handleChangeCategory}
          />
        </FormControl>
      </Stack>
      <Box
        display="flex"
        flexDirection="column-reverse"
        gap={2}
        sx={{ overflow: 'auto', scrollbarGutter: 'stable' }}
      >
        {R.isEmpty(visibleGroupings) && (
          <Typography variant="subtitle1" fontWeight={500}>
            In order to change the current graph's colors in this modal, there
            must be two chosen groupings of categories. To do so, head to Chart
            Tools and select two groupings under 'Group By'. You can still
            change the colors of other charts using this modal by selecting a
            category.
          </Typography>
        )}
        {currentCategoryId &&
          R.map((category) => (
            <ColorPickerAlt
              key={category}
              value={localCategoryColors[category]}
              colorLabel={allCategoryProperties[category].lastCategory}
              changeArg={category}
              onChangeFn={handleChangeFn}
            />
          ))(visibleGroupings)}
      </Box>
    </BaseModal>
  )
}

export default memo(ColorChangeModal)
