import {
  Box,
  Checkbox,
  FormGroup,
  FormControlLabel,
  FormHelperText,
} from '@mui/material'
import PropTypes from 'prop-types'
import * as R from 'ramda'
import { Fragment, useEffect, useMemo, useState } from 'react'

import FetchedIcon from './FetchedIcon'

import { forceArray, getActiveDefaults, getOrDefault } from '../../utils'

const DEFAULT_SIZE = '20px'

const styles = {
  getCheckbox: ({ color, size, activeColor, activeSize }) => ({
    color,
    '& .MuiSvgIcon-root': {
      fontSize: size,
    },
    '&.Mui-checked': {
      color: activeColor,
      '& .MuiSvgIcon-root': {
        fontSize: activeSize,
      },
    },
  }),
}

const box = {
  CHECKED: 'checked',
  PARTIAL: 'partial',
  UNCHECKED: 'unchecked',
}

// Walks each option's `path` (plus its own `name` as the final segment),
// synthesizing one node per path segment. Only the final segment of a walk
// (`isLeaf`) corresponds to a real option record (`opt`) with attrs;
// earlier segments are auto-created "folder" grouping nodes with no `opt`.
const getNodes = (options, value) => {
  const rootKey = ''
  const rootNode = {
    name: 'root',
    parentKey: null,
    childrenKeys: [],
    isLeaf: false,
  }
  const nodes = new Map([[rootKey, rootNode]])
  const initialChecked = new Map()

  R.forEach(([optionKey, option]) => {
    const inValue = value.includes(optionKey)
    let parentKey = rootKey
    R.addIndex(R.forEach)(
      (currentName, depth) => {
        const isLeaf = R.equals(depth, R.length(option.path))
        const currentKey = isLeaf ? optionKey : parentKey + currentName
        if (!nodes.has(currentKey)) {
          const currentNode = {
            name: currentName,
            parentKey: parentKey,
            childrenKeys: [],
            isLeaf,
            opt: isLeaf ? option : undefined,
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

  // A disabled leaf can never change state, even when an ancestor
  // folder's bulk toggle would otherwise force it to match.
  const isNodeEnabled = (key) => {
    const node = nodes.get(key)
    return !node.isLeaf || getOrDefault(node.opt?.enabled, true)
  }

  const updateSubtree = (currentKey, boxState) => {
    R.forEach((childKey) => {
      if (isNodeEnabled(childKey)) {
        checked.set(childKey, boxState)
      }
      updateSubtree(childKey, boxState)
    }, nodes.get(currentKey).childrenKeys)
  }
  updateSubtree(nodeKey, checked.get(nodeKey))
  return checked
}

const PropNested = ({ prop, currentVal, sx = [], onChange }) => {
  const { enabled, options, helperText, ...propAttrs } = prop
  const value = R.defaultTo(prop.value, currentVal)
  const { nodes, initialChecked } = getNodes(options, value)
  const [checked, setChecked] = useState(initialChecked)

  const activeDefaults = useMemo(
    () => getActiveDefaults(propAttrs),
    [propAttrs]
  )

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
        activeDefaults={activeDefaults}
        propAttrs={propAttrs}
        handleClick={(nodeKey) => {
          if (!enabled) return
          const node = nodes.get(nodeKey)
          if (node.isLeaf && !getOrDefault(node.opt?.enabled, true)) return
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
      <FormHelperText>{helperText}</FormHelperText>
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
  activeDefaults = {},
  propAttrs = {},
}) => {
  return (
    <FormGroup>
      {R.map((key) => {
        const { name, childrenKeys, isLeaf, opt = {} } = nodes.get(key)
        const nodeChecked = R.equals(checked.get(key), box.CHECKED)
        const nodeEnabled = !isLeaf || getOrDefault(opt.enabled, true)
        const nodeDisabled = disabled || !nodeEnabled

        const label = isLeaf
          ? nodeChecked
            ? getOrDefault(opt.activeName, opt.name ?? name)
            : (opt.name ?? name)
          : name

        const icon = isLeaf ? getOrDefault(opt.icon, propAttrs.icon) : undefined
        const color = isLeaf
          ? getOrDefault(opt.color, propAttrs.color)
          : undefined
        const size = isLeaf
          ? (getOrDefault(opt.size, propAttrs.size) ?? DEFAULT_SIZE)
          : undefined
        const activeIcon = isLeaf
          ? (getOrDefault(opt.activeIcon, opt.icon) ?? activeDefaults.icon)
          : undefined
        const activeColor = isLeaf
          ? (getOrDefault(opt.activeColor, opt.color) ?? activeDefaults.color)
          : undefined
        const activeSize = isLeaf
          ? (getOrDefault(opt.activeSize, opt.size) ??
            activeDefaults.size ??
            DEFAULT_SIZE)
          : undefined

        const childrenNodes = R.isEmpty(childrenKeys) ? null : (
          <PropNestedHelper
            rootKey={key}
            depth={depth + 1}
            {...{
              disabled,
              nodes,
              checked,
              handleClick,
              activeDefaults,
              propAttrs,
            }}
          />
        )
        return (
          <Fragment key={key}>
            <FormControlLabel
              disabled={nodeDisabled}
              label={label}
              sx={{ pl: 1, ml: depth * 5 }}
              control={
                <Checkbox
                  name="cave-nested-checkbox"
                  checked={nodeChecked}
                  indeterminate={R.equals(checked.get(key), box.PARTIAL)}
                  {...(isLeaf && {
                    sx: styles.getCheckbox({
                      color,
                      size,
                      activeColor,
                      activeSize,
                    }),
                    ...(icon && {
                      icon: (
                        <FetchedIcon iconName={icon} {...{ color, size }} />
                      ),
                    }),
                    ...(activeIcon && {
                      checkedIcon: (
                        <FetchedIcon
                          iconName={activeIcon}
                          color={activeColor}
                          size={activeSize}
                        />
                      ),
                    }),
                  })}
                  onClick={() => handleClick(key)}
                />
              }
            />
            {childrenNodes}
          </Fragment>
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
  disabled: PropTypes.bool,
  activeDefaults: PropTypes.object,
  propAttrs: PropTypes.object,
}

export default PropNested
