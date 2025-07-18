import { Box, Checkbox, FormGroup, FormControlLabel } from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React, { useEffect } from 'react'

import { forceArray } from '../../utils'

const box = {
  CHECKED: 'checked',
  PARTIAL: 'partial',
  UNCHECKED: 'unchecked',
}

const getNodes = (options, value) => {
  const rootKey = ''
  const rootNode = {
    name: 'root',
    parentKey: null,
    childrenKeys: [],
  }
  const nodes = new Map([[rootKey, rootNode]])
  const initialChecked = new Map()

  R.forEach(([optionKey, option]) => {
    const inValue = value.includes(optionKey)
    let parentKey = rootKey
    R.addIndex(R.forEach)(
      (currentName, depth) => {
        const currentKey = R.equals(depth, R.length(option.path))
          ? optionKey
          : parentKey + currentName
        if (!nodes.has(currentKey)) {
          const currentNode = {
            name: currentName,
            parentKey: parentKey,
            childrenKeys: [],
          }
          nodes.set(currentKey, currentNode)
          nodes.get(parentKey).childrenKeys.push(currentKey)
          inValue
            ? initialChecked.set(currentKey, box.CHECKED)
            : initialChecked.set(currentKey, box.UNCHECKED)
        }
        const parentChecked = initialChecked.get(parentKey)
        if (
          (!inValue && R.equals(parentChecked, box.CHECKED)) ||
          (inValue && R.equals(parentChecked, box.UNCHECKED))
        ) {
          initialChecked.set(parentKey, box.PARTIAL)
        }
        parentKey = currentKey
      },
      R.append(option.name, option.path)
    )
  }, R.toPairs(options))

  return {
    nodes: nodes,
    initialChecked: initialChecked,
  }
}

const updateChecked = (nodeKey, nodes, prevChecked) => {
  const checked = new Map(prevChecked)
  R.equals(checked.get(nodeKey), box.CHECKED)
    ? checked.set(nodeKey, box.UNCHECKED)
    : checked.set(nodeKey, box.CHECKED)

  let currentKey = nodes.get(nodeKey).parentKey
  while (currentKey !== null) {
    const currentNode = nodes.get(currentKey)
    const childrenChecked = R.map(
      (childKey) => checked.get(childKey),
      currentNode.childrenKeys
    )
    if (R.all(R.equals(box.CHECKED))(childrenChecked)) {
      checked.set(currentKey, box.CHECKED)
    } else if (R.all(R.equals(box.UNCHECKED))(childrenChecked)) {
      checked.set(currentKey, box.UNCHECKED)
    } else {
      checked.set(currentKey, box.PARTIAL)
    }
    currentKey = currentNode.parentKey
  }

  const updateSubtree = (currentKey, boxState) => {
    R.forEach((childKey) => {
      checked.set(childKey, boxState)
      updateSubtree(childKey, boxState)
    }, nodes.get(currentKey).childrenKeys)
  }
  updateSubtree(nodeKey, checked.get(nodeKey))
  return checked
}

const PropNested = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, options } = prop
  const value = R.defaultTo(prop.value, currentVal)
  const { nodes, initialChecked } = getNodes(options, value)
  const [checked, setChecked] = React.useState(initialChecked)

  useEffect(() => {
    const { initialChecked } = getNodes(options, value)
    setChecked(initialChecked)
  }, [value, options])

  return (
    <Box sx={[{ p: 1 }, ...forceArray(sx)]}>
      <PropNestedHelper
        depth={0}
        nodes={nodes}
        checked={checked}
        rootKey={''}
        handleClick={(nodeKey) => {
          if (!enabled) return
          const updatedChecked = updateChecked(nodeKey, nodes, checked)
          onChange(
            R.filter(
              (key) =>
                R.equals(updatedChecked.get(key), box.CHECKED) &&
                R.includes(key, Object.keys(options)),
              Array.from(updatedChecked.keys())
            )
          )
          setChecked(updatedChecked)
        }}
        disabled={!enabled}
      />
    </Box>
  )
}
PropNested.propTypes = {
  prop: PropTypes.object,
  currentVal: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.string),
  ]),
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  onChange: PropTypes.func,
}

const PropNestedHelper = ({
  depth,
  nodes,
  checked,
  rootKey,
  handleClick,
  disabled,
}) => {
  return (
    <FormGroup>
      {R.map((key) => {
        const { name: label, childrenKeys } = nodes.get(key)
        const childrenNodes = R.isEmpty(childrenKeys) ? null : (
          <PropNestedHelper
            rootKey={key}
            depth={depth + 1}
            {...{ disabled, nodes, checked, handleClick }}
          />
        )
        return (
          <React.Fragment key={key}>
            <FormControlLabel
              {...{ disabled, label }}
              sx={{ pl: 1, ml: depth * 5 }}
              control={
                <Checkbox
                  name="cave-nested-checkbox"
                  checked={R.equals(checked.get(key), box.CHECKED)}
                  indeterminate={R.equals(checked.get(key), box.PARTIAL)}
                  onClick={() => handleClick(key)}
                />
              }
            />
            {childrenNodes}
          </React.Fragment>
        )
      }, nodes.get(rootKey).childrenKeys)}
    </FormGroup>
  )
}
PropNestedHelper.propTypes = {
  depth: PropTypes.number,
  nodes: PropTypes.object,
  checked: PropTypes.object,
  rootKey: PropTypes.string,
  handleClick: PropTypes.func,
  enabled: PropTypes.bool,
}

export default PropNested
