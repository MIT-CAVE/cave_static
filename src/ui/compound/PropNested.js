import {
  Checkbox,
  Divider,
  FormGroup,
  FormControlLabel,
  Box,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import React from 'react'

import { forceArray } from '../../utils'

const getStyles = (enabled) => ({
  display: 'flex',
  width: '100%',
  p: 1,
  pointerEvents: enabled ? '' : 'none',
  opacity: enabled ? '' : 0.7,
})

const getNodes = (options, value) => {
  const rootKey = ''
  const rootNode = {
    name: 'root',
    parentKey: null,
    childrenKeys: [],
  }
  const nodes = new Map([[rootKey, rootNode]])
  const initialChecked = new Set()

  R.forEach(([optionKey, optionVal]) => {
    let parentKey = rootKey
    R.addIndex(R.forEach)((currentName, depth) => {
      const currentKey =
        depth === R.length(optionVal.path) ? optionKey : parentKey + currentName
      if (!nodes.has(currentKey)) {
        const currentNode = {
          name: currentName,
          parentKey: parentKey,
          childrenKeys: [],
        }
        nodes.set(currentKey, currentNode)
        nodes.get(parentKey).childrenKeys.push(currentKey)
        if (value.includes(optionKey)) initialChecked.add(currentKey)
      }
      if (!value.includes(optionKey) && initialChecked.has(parentKey))
        initialChecked.delete(parentKey)
      parentKey = currentKey
    }, R.append(optionVal.name, optionVal.path))
  }, R.toPairs(options))

  return {
    nodes: nodes,
    initialChecked: initialChecked,
  }
}

const updateTree = (nodeKey, nodes, prevChecked) => {
  const checked = new Set(prevChecked)
  checked.has(nodeKey) ? checked.delete(nodeKey) : checked.add(nodeKey)

  let currentKey = nodes.get(nodeKey).parentKey
  while (currentKey !== null) {
    const currentNode = nodes.get(currentKey)
    if (checked.has(currentKey) && !checked.has(nodeKey)) {
      checked.delete(currentKey)
    } else if (
      !checked.has(currentKey) &&
      R.all((childKey) => checked.has(childKey))(currentNode.childrenKeys)
    ) {
      checked.add(currentKey)
    }
    currentKey = currentNode.parentKey
  }

  const updateSubtree = (currentKey) => {
    R.forEach((childKey) => {
      if (checked.has(childKey) && !checked.has(currentKey)) {
        checked.delete(childKey)
      } else if (!checked.has(childKey) && checked.has(currentKey)) {
        checked.add(childKey)
      }
      updateSubtree(childKey)
    }, nodes.get(currentKey).childrenKeys)
  }
  updateSubtree(nodeKey)
  return checked
}

const PropNested = ({ prop, currentVal, sx = [], onChange, ...props }) => {
  const { enabled = false, options } = prop
  const value = R.defaultTo(prop.value, currentVal)
  const { nodes, initialChecked } = getNodes(options, value)
  const [checked, setChecked] = React.useState(initialChecked)
  return (
    <Box sx={[getStyles(enabled), ...forceArray(sx)]} {...props}>
      <PropNestedHelper
        depth={0}
        nodes={nodes}
        checked={checked}
        rootKey={''}
        handleClick={(nodeKey) => {
          if (!enabled) return
          const updatedChecked = updateTree(nodeKey, nodes, checked)
          onChange(
            R.filter(
              (key) => R.includes(key, Object.keys(options)),
              Array.from(updatedChecked)
            )
          )
          setChecked(updatedChecked)
        }}
        enabled={enabled}
      />
      <Divider orientation="vertical" flexItem />
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
  enabled,
}) => {
  return (
    <FormGroup>
      {R.map((key) => {
        const { name: label, childrenKeys } = nodes.get(key)
        const childrenNodes = R.isEmpty(childrenKeys) ? null : (
          <PropNestedHelper
            depth={depth + 1}
            nodes={nodes}
            checked={checked}
            rootKey={key}
            handleClick={handleClick}
            enabled={enabled}
          />
        )
        return (
          <>
            <FormControlLabel
              {...{ key, label }}
              disabled={!enabled}
              sx={{ pl: 1, ml: depth * 5 }}
              control={
                <Checkbox
                  checked={checked.has(key)}
                  onClick={() => handleClick(key)}
                />
              }
            />
            {childrenNodes}
          </>
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
