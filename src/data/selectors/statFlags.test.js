import { describe, it, expect } from 'vitest'

import { selectChartStats, selectFilterableStats } from './index'

const mockState = {
  data: {
    groupedOutputs: {
      data: {
        salesData: {
          stats: {
            demand: {
              name: 'Demand',
              allowCharting: false,
              help: 'Demand help',
            },
            sales: { name: 'Sales', allowFiltering: false, help: 'Sales help' },
            cost: { name: 'Cost' },
          },
        },
      },
    },
  },
}

describe('groupedOutputs stat flags', () => {
  it('omits stats with `allowCharting: false` from the chart stats', () => {
    const chartStats = selectChartStats(mockState)
    expect(Object.keys(chartStats.salesData).sort()).toEqual(['cost', 'sales'])
  })

  it('omits stats with `allowFiltering: false` from the filterable stats', () => {
    const filterable = selectFilterableStats(mockState).salesData
    expect(Object.keys(filterable).sort()).toEqual(['cost', 'demand'])
  })

  it('keeps both allowed by default', () => {
    expect(selectChartStats(mockState).salesData.cost).toBeDefined()
    expect(selectFilterableStats(mockState).salesData.cost).toBeDefined()
  })

  it('passes `help` through to both lists', () => {
    expect(selectChartStats(mockState).salesData.sales.help).toBe('Sales help')
    expect(selectFilterableStats(mockState).salesData.demand.help).toBe(
      'Demand help'
    )
  })

  it('keeps the flags of datasets that share a stat id apart', () => {
    const state = {
      data: {
        groupedOutputs: {
          data: {
            a: { stats: { x: { name: 'X', allowFiltering: false } } },
            b: { stats: { x: { name: 'X' } } },
          },
        },
      },
    }
    const filterable = selectFilterableStats(state)
    expect(filterable.a.x).toBeUndefined()
    expect(filterable.b.x).toBeDefined()
  })
})
