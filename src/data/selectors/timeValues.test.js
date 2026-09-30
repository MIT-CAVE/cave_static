import { describe, it, expect } from 'vitest'

import { getTimeValue } from '../../utils'

describe('getTimeValue', () => {
  it('preserves all primitive, array, and null fields before a changed child object', () => {
    const original = {
      id: 'node_1',
      name: 'Test Node',
      type: 'node',
      tags: ['alpha', 'beta'],
      extra: null,
      sub: {
        timeValues: {
          0: { val: 42 },
        },
        val: 10,
      },
      after: 'stays',
    }

    const result = getTimeValue(0, original)
    expect(result.id).toBe('node_1')
    expect(result.name).toBe('Test Node')
    expect(result.type).toBe('node')
    expect(result.tags).toEqual(['alpha', 'beta'])
    expect(result.extra).toBeNull()
    expect(result.sub.val).toBe(42)
    expect(result.after).toBe('stays')
  })

  it('preserves referential equality when no time values match or change', () => {
    const original = {
      id: 'node_1',
      name: 'Unchanged Node',
      nested: {
        count: 5,
        items: [1, 2, 3],
      },
      withTimeValues: {
        timeValues: {
          1: { count: 10 },
        },
        count: 5,
      },
    }

    // timeIndex 0 has no matching timeValues
    const result = getTimeValue(0, original)
    expect(result).toBe(original)
  })

  it('applies timeValues on the root object while preserving existing fields', () => {
    const original = {
      id: 'node_root',
      name: 'Root',
      latitude: [40.0, 50.0],
      timeValues: {
        0: {
          latitude: [41.0, 51.0],
        },
      },
    }

    const result = getTimeValue(0, original)
    expect(result.id).toBe('node_root')
    expect(result.name).toBe('Root')
    expect(result.latitude).toEqual([41.0, 51.0])
  })

  it('correctly merges sparse list updates in timeValues', () => {
    const original = {
      id: 'sparse_node',
      values: ['a', 'b', 'c'],
      timeValues: {
        0: {
          values: { 1: 'updated_b' },
        },
      },
    }

    const result = getTimeValue(0, original)
    expect(result.id).toBe('sparse_node')
    expect(result.values).toEqual(['a', 'updated_b', 'c'])
  })

  it('preserves object properties in timeValues when target is not a list', () => {
    const original = {
      id: 'obj_node',
      config: { active: true },
      timeValues: {
        0: {
          config: { active: false },
        },
      },
    }

    const result = getTimeValue(0, original)
    expect(result.id).toBe('obj_node')
    expect(result.config).toEqual({ active: false })
  })

  it('handles non-object, null, and array inputs gracefully', () => {
    expect(getTimeValue(0, null)).toBeNull()
    expect(getTimeValue(0, undefined)).toBeUndefined()
    expect(getTimeValue(0, 42)).toBe(42)
    expect(getTimeValue(0, 'string')).toBe('string')
    const arr = [1, 2, 3]
    expect(getTimeValue(0, arr)).toBe(arr)
  })

  it('handles multiple nested child objects with only some changing', () => {
    const original = {
      propA: 'a',
      child1: { count: 1 },
      propB: 'b',
      child2: {
        timeValues: {
          0: { count: 20 },
        },
        count: 2,
      },
      propC: 'c',
      child3: { count: 3 },
    }

    const result = getTimeValue(0, original)
    expect(result.propA).toBe('a')
    expect(result.propB).toBe('b')
    expect(result.propC).toBe('c')
    expect(result.child1).toBe(original.child1) // untouched child preserves reference
    expect(result.child2.count).toBe(20)
    expect(result.child3).toBe(original.child3) // untouched child preserves reference
  })

  it('runs efficiently on large trees (10,000 nodes)', () => {
    const nodeCount = 10000
    const tree = {}
    for (let i = 0; i < nodeCount; i++) {
      tree[`node_${i}`] = {
        id: `node_${i}`,
        type: 'node',
        name: `Node ${i}`,
        data: {
          location: {
            latitude: [40.0],
            longitude: [-75.0],
            ...(i % 50 === 0 && {
              timeValues: {
                0: { latitude: [41.0] },
                1: { latitude: [42.0] },
              },
            }),
          },
        },
      }
    }

    const start = performance.now()
    const result0 = getTimeValue(0, tree)
    const duration = performance.now() - start

    // 200 nodes (i % 50 === 0) changed at time 0
    expect(result0['node_0'].data.location.latitude).toEqual([41.0])
    expect(result0['node_0'].id).toBe('node_0')
    expect(result0['node_0'].name).toBe('Node 0')
    expect(result0['node_0'].type).toBe('node')

    // Unchanged node preserved by reference
    expect(result0['node_1']).toBe(tree['node_1'])

    // Traversal across 10k complex nested nodes should complete well within 100ms
    expect(duration).toBeLessThan(100)
  })
})
