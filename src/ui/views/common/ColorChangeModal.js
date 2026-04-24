import { TextField, Box, Stack, Typography } from '@mui/material'
import { colord } from 'colord'
import * as R from 'ramda'
import { useState, useMemo, useEffect, useCallback, memo } from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { List } from 'react-window'

import BaseModal from './BaseModal'

import { mutateLocal } from '../../../data/local'
import {
  selectChartById,
  selectMergedStatGroupings,
  selectSync,
} from '../../../data/selectors'
import { colorGen } from '../../../utils/ColorGen'
import ColorPicker, { useColorPicker } from '../../compound/ColorPicker'

import { Select, HelpTooltip } from '../../compound'

import {
  getColorString,
  forceArray,
  getLabelFn,
  includesPath,
} from '../../../utils'

const styles = {
  modalSlots: {
    paper: {
      sx: {
        width: '750px',
        display: 'flex',
        flexDirection: 'column',
        gap: 2,
      },
    },
  },
  help: {
    position: 'absolute',
    top: 30,
    right: 20,
  },
  search: {
    mr: 1.45,
  },
  searchField: {
    flex: 13,
  },
  categorySelect: {
    flex: 7,
  },
  content: {
    display: 'flex',
    gap: 2,
    overflow: 'auto',
    height: '100%',
    scrollbarGutter: 'stable',
  },
}

const categorySelectSlotProps = {
  formControl: { sx: styles.categorySelect },
}

const ListRowComponent = ({
  index,
  style,
  visibleGroupings,
  localCategoryColors,
  allCategoryProperties,
  onChangeFn,
}) => {
  const category = visibleGroupings[index]
  const handleChange = useCallback(
    (value, colors) => onChangeFn(category)(value, colors),
    [category, onChangeFn]
  )
  return (
    <ColorPicker
      sx={style}
      key={category}
      value={localCategoryColors[category]}
      colorLabel={allCategoryProperties[category].lastCategory}
      onChange={handleChange}
    />
  )
}

const ColorChangeModal = ({ index, label, labelExtra, onClose }) => {
  const [searchText, setSearchText] = useState('')
  const [currentCategoryId, setCurrentCategoryId] = useState(null)
  const [localCategoryColors, setLocalCategoryColors] = useState({})
  const statGroupings = useSelector(selectMergedStatGroupings)
  const chartObj = useSelector((state) => selectChartById(state, index))
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
        R.unnest,
        R.uniq // Remove duplicate levels across categories
      )(statGroupings),
    [statGroupings]
  )

  useEffect(() => {
    if (chartObj?.groupingLevel) {
      const categoryId = chartObj.groupingLevel[1]
      setCurrentCategoryId(categoryId)
    }
  }, [chartObj?.groupingLevel])

  const handleChangeCategory = useCallback((value) => {
    setCurrentCategoryId(value)
  }, [])

  const getCategoryLabel = useCallback(
    (categoryParents, levelCategories, category, index, level) => {
      if (!(level in categoryParents)) return `${category}`

      const parent = categoryParents[level]
      return `${category} \u279D ${getCategoryLabel(
        categoryParents,
        levelCategories,
        levelCategories[parent][index],
        index,
        parent
      )}`
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
    const groupingMaps = R.map(([groupingLabel, grouping]) => {
      const levels = grouping.levels
      const parents = R.pipe(R.pluck('parent'), R.reject(R.isNil))(levels)
      const levelCategories = R.pipe(R.prop('data'), R.dissoc('id'))(grouping)
      const coloring = R.pipe(
        R.pluck('coloring'),
        R.reject(R.isNil),
        R.values,
        R.mergeAll
      )(levels)
      return constructSingleCategoryProperties(
        groupingLabel,
        parents,
        levelCategories,
        coloring
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
        allCategoryProperties[category].lastCategory,
      ]
      handleChangeRaw(getColorString(value), colorOutputs, pathTail)
    },
    [handleChangeRaw, allCategoryProperties]
  )

  const getLabel = useCallback(
    (option) => getLabelFn(categoryOptions, option),
    [categoryOptions]
  )

  const rowProps = useMemo(
    () => ({
      visibleGroupings,
      localCategoryColors,
      allCategoryProperties,
      onChangeFn: handleChangeFn,
    }),
    [
      allCategoryProperties,
      handleChangeFn,
      localCategoryColors,
      visibleGroupings,
    ]
  )

  return (
    <BaseModal
      open={index != null}
      slotProps={styles.modalSlots}
      {...{ label, labelExtra, onClose }}
    >
      <Box sx={styles.help}>
        <HelpTooltip
          title="Notes on color changes"
          content="Any color changes are applied to ALL relevant charts. Color changes to same-name categories applies to all categories with shared name."
          size={28}
        />
      </Box>
      <Stack useFlexGap direction="row" spacing={2} sx={styles.search}>
        <TextField
          placeholder="Search final category level"
          label="Search"
          value={searchText}
          sx={styles.searchField}
          onChange={handleChangeSearchText}
        />
        <Select
          id="category"
          labelId="category-label"
          label="Category"
          slotProps={categorySelectSlotProps}
          value={currentCategoryId ?? ''}
          optionsList={categoryOptions}
          getLabel={getLabel}
          onSelect={handleChangeCategory}
        />
      </Stack>
      <Box sx={styles.content}>
        {R.isEmpty(visibleGroupings) && (
          <Typography variant="subtitle1" fontWeight={500}>
            In order to change the current graph's colors in this modal, there
            must be two chosen groupings of categories. To do so, head to Chart
            Tools and select two groupings under 'Group By'. You can still
            change the colors of other charts using this modal by selecting a
            category.
          </Typography>
        )}
        {currentCategoryId && (
          <List
            rowHeight={88}
            overscanCount={5}
            {...{ rowProps }}
            rowCount={visibleGroupings.length}
            rowComponent={ListRowComponent}
          />
        )}
      </Box>
    </BaseModal>
  )
}

export default memo(ColorChangeModal)
