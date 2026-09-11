import { describe, it, expect } from 'vitest'

import {
  selectMemoizedChartFunc,
  selectMemoizedGlobalOutputFunc,
} from './index'

import { chartVariant } from '../../utils/enums'

const mockState = {
  data: {
    groupedOutputs: {
      groupings: {
        location: {
          data: {
            id: ['loc1', 'loc2', 'loc3', 'loc4', 'loc5', 'loc6'],
            region: ['East', 'East', 'East', 'West', 'West', 'West'],
            state: ['NY', 'NY', 'MA', 'CA', 'CA', 'WA'],
          },
          levels: {
            region: {
              name: 'Region',
              ordering: ['East', 'West'],
            },
            state: {
              name: 'State',
              parent: 'region',
              ordering: ['NY', 'MA', 'CA', 'WA'],
            },
          },
        },
        category: {
          data: {
            id: ['catA', 'catB', 'catC'],
            type: ['Food', 'Food', 'Non-Food'],
          },
          levels: {
            type: {
              name: 'Type',
              ordering: ['Food', 'Non-Food'],
            },
          },
        },
      },
      data: {
        salesData: {
          stats: {
            revenue: { name: 'Revenue', unit: '$' },
            cost: { name: 'Cost', unit: '$' },
            units: { name: 'Units' },
          },
          valueLists: {
            revenue: [100, 150, 200, 120, 180, 250],
            cost: [60, 90, 110, 70, 100, 140],
            units: [10, 15, 20, 12, 18, 25],
          },
          groupLists: {
            location: ['loc1', 'loc2', 'loc3', 'loc4', 'loc5', 'loc6'],
            category: ['catA', 'catB', 'catC', 'catB', 'catC', 'catC'],
          },
        },
      },
    },
    associated: {
      data: {
        session_1: {
          name: 'Scenario A',
          data: {
            globalOutputs: {
              props: {
                kpiRevenue: {
                  id: 'kpiRevenue',
                  name: 'Total Revenue',
                  value: 1000,
                },
                kpiCost: { id: 'kpiCost', name: 'Total Cost', value: 600 },
              },
            },
          },
        },
        session_2: {
          name: 'Scenario B',
          data: {
            globalOutputs: {
              props: {
                kpiRevenue: {
                  id: 'kpiRevenue',
                  name: 'Total Revenue',
                  value: 1200,
                },
                kpiCost: { id: 'kpiCost', name: 'Total Cost', value: 700 },
              },
            },
          },
        },
      },
    },
  },
}

describe('Chart Data Serializers', () => {
  const chartFunc = selectMemoizedChartFunc(mockState)

  describe('1. Box Plot Data Serialization', () => {
    it('serializes single grouping to array of raw values per category (preserves distribution)', async () => {
      const chartObj = {
        chartType: chartVariant.BOX_PLOT,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      expect(result[0].value).toEqual([100, 150, 200])
      expect(result[1].name).toBe('West')
      expect(result[1].value).toEqual([120, 180, 250])
    })

    it('serializes no groupings to a single All category with all values', async () => {
      const chartObj = {
        chartType: chartVariant.BOX_PLOT,
        dataset: 'salesData',
        groupingId: [],
        groupingLevel: [],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('All')
      expect(result[0].value).toEqual([100, 150, 200, 120, 180, 250])
    })

    it('serializes hierarchical 2-level grouping with subgroup arrays of raw values', async () => {
      const chartObj = {
        chartType: chartVariant.BOX_PLOT,
        dataset: 'salesData',
        groupingId: ['location', 'category'],
        groupingLevel: ['region', 'type'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].name).toBe('Food')
      expect(result[0].children[0].value).toEqual([100, 150])
      expect(result[0].children[1].name).toBe('Non-Food')
      expect(result[0].children[1].value).toEqual([200])
    })

    it('serializes with aggregationGroupingLevel by aggregating subgroups before distributing', async () => {
      const chartObj = {
        chartType: chartVariant.BOX_PLOT,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [
          {
            statId: 'revenue',
            aggregationType: 'sum',
            aggregationGroupingId: 'location',
            aggregationGroupingLevel: 'state',
          },
        ],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      // East states: NY = 100 + 150 = 250, MA = 200
      expect(result[0].value).toEqual([250, 200])
      // West states: CA = 120 + 180 = 300, WA = 250
      expect(result[1].name).toBe('West')
      expect(result[1].value).toEqual([300, 250])
    })
  })

  describe('2. Distribution Chart Data Serialization', () => {
    it('serializes single grouping to array of raw values per category', async () => {
      const chartObj = {
        chartType: chartVariant.DISTRIBUTION,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      expect(result[0].value).toEqual([100, 150, 200])
      expect(result[1].name).toBe('West')
      expect(result[1].value).toEqual([120, 180, 250])
    })

    it('serializes no groupings to All category with all values', async () => {
      const chartObj = {
        chartType: chartVariant.DISTRIBUTION,
        dataset: 'salesData',
        groupingId: [],
        groupingLevel: [],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(1)
      expect(result[0].name).toBe('All')
      expect(result[0].value).toEqual([100, 150, 200, 120, 180, 250])
    })
    it('serializes hierarchical 2-level grouping with subgroup arrays of raw values', async () => {
      const chartObj = {
        chartType: chartVariant.DISTRIBUTION,
        dataset: 'salesData',
        groupingId: ['location', 'category'],
        groupingLevel: ['region', 'type'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      expect(result[0].children).toHaveLength(2)
      expect(result[0].children[0].name).toBe('Food')
      expect(result[0].children[0].value).toEqual([100, 150])
      expect(result[0].children[1].name).toBe('Non-Food')
      expect(result[0].children[1].value).toEqual([200])
    })
  })

  describe('3. Bar, Line, Waterfall, and Area Chart Data Serialization', () => {
    it('aggregates sum correctly for single grouping', async () => {
      const chartObj = {
        chartType: chartVariant.BAR,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toEqual([
        { name: 'East', value: [450] },
        { name: 'West', value: [550] },
      ])
    })

    it('aggregates mean correctly for single grouping', async () => {
      const chartObj = {
        chartType: chartVariant.LINE,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'mean' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toHaveLength(2)
      expect(result[0].name).toBe('East')
      expect(result[0].value[0]).toBe(150) // (100 + 150 + 200) / 3 = 150
      expect(result[1].name).toBe('West')
      expect(result[1].value[0]).toBeCloseTo(183.333, 2) // (120 + 180 + 250) / 3 = 183.333
    })

    it('aggregates min and max correctly for single grouping', async () => {
      const minChartObj = {
        chartType: chartVariant.WATERFALL,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'min' }],
      }
      const maxChartObj = {
        chartType: chartVariant.AREA,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [{ statId: 'revenue', aggregationType: 'max' }],
      }

      const minResult = await chartFunc(minChartObj)
      expect(minResult).toEqual([
        { name: 'East', value: [100] },
        { name: 'West', value: [120] },
      ])

      const maxResult = await chartFunc(maxChartObj)
      expect(maxResult).toEqual([
        { name: 'East', value: [200] },
        { name: 'West', value: [250] },
      ])
    })

    it('aggregates divisor correctly (revenue / units)', async () => {
      const chartObj = {
        chartType: chartVariant.BAR,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [
          {
            statId: 'revenue',
            statIdDivisor: 'units',
            aggregationType: 'divisor',
          },
        ],
      }

      const result = await chartFunc(chartObj)
      expect(result).toEqual([
        { name: 'East', value: [10] }, // 450 / 45 = 10
        { name: 'West', value: [10] }, // 550 / 55 = 10
      ])
    })
  })

  describe('4. Multi-Statistic & Stacked Charts', () => {
    it('serializes multiple statistics into multi-element value array (Table & Mixed)', async () => {
      const tableChartObj = {
        chartType: chartVariant.TABLE,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [
          { statId: 'revenue', aggregationType: 'sum' },
          { statId: 'cost', aggregationType: 'sum' },
          { statId: 'units', aggregationType: 'sum' },
        ],
      }

      const mixedChartObj = {
        chartType: chartVariant.MIXED,
        dataset: 'salesData',
        groupingId: ['location'],
        groupingLevel: ['region'],
        stats: [
          { statId: 'revenue', aggregationType: 'sum' },
          { statId: 'cost', aggregationType: 'sum' },
        ],
      }

      const tableResult = await chartFunc(tableChartObj)
      expect(tableResult).toEqual([
        { name: 'East', value: [450, 260, 45] },
        { name: 'West', value: [550, 310, 55] },
      ])

      const mixedResult = await chartFunc(mixedChartObj)
      expect(mixedResult).toEqual([
        { name: 'East', value: [450, 260] },
        { name: 'West', value: [550, 310] },
      ])
    })

    it('serializes stacked bar with hierarchical subgroups', async () => {
      const chartObj = {
        chartType: chartVariant.STACKED_BAR,
        dataset: 'salesData',
        groupingId: ['location', 'category'],
        groupingLevel: ['region', 'type'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toEqual([
        {
          name: 'East',
          children: [
            { name: 'Food', value: [250] },
            { name: 'Non-Food', value: [200] },
          ],
        },
        {
          name: 'West',
          children: [
            { name: 'Food', value: [120] },
            { name: 'Non-Food', value: [430] },
          ],
        },
      ])
    })
  })

  describe('5. Hierarchical & Single-Value Charts (Sunburst, Treemap, Heatmap, Gauge)', () => {
    it('serializes 2-level nested categories into children hierarchy', async () => {
      const chartObj = {
        chartType: chartVariant.SUNBURST,
        dataset: 'salesData',
        groupingId: ['location', 'category'],
        groupingLevel: ['region', 'type'],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toEqual([
        {
          name: 'East',
          children: [
            { name: 'Food', value: [250] },
            { name: 'Non-Food', value: [200] },
          ],
        },
        {
          name: 'West',
          children: [
            { name: 'Food', value: [120] },
            { name: 'Non-Food', value: [430] },
          ],
        },
      ])
    })

    it('serializes gauge chart to single aggregated value', async () => {
      const chartObj = {
        chartType: chartVariant.GAUGE,
        dataset: 'salesData',
        groupingId: [],
        groupingLevel: [],
        stats: [{ statId: 'revenue', aggregationType: 'sum' }],
      }

      const result = await chartFunc(chartObj)
      expect(result).toEqual([{ name: 'All', value: [1000] }])
    })
  })

  describe('6. Global Outputs Serializer', () => {
    it('serializes global outputs across scenarios', () => {
      const globalOutputFunc = selectMemoizedGlobalOutputFunc(mockState)
      const chartObj = {
        globalOutput: ['kpiRevenue', 'kpiCost'],
        sessions: ['Scenario A', 'Scenario B'],
      }

      const result = globalOutputFunc(chartObj)
      expect(result).toEqual([
        {
          name: 'Scenario A',
          children: [
            { id: 'kpiRevenue', name: 'Total Revenue', value: [1000] },
            { id: 'kpiCost', name: 'Total Cost', value: [600] },
          ],
        },
        {
          name: 'Scenario B',
          children: [
            { id: 'kpiRevenue', name: 'Total Revenue', value: [1200] },
            { id: 'kpiCost', name: 'Total Cost', value: [700] },
          ],
        },
      ])
    })
  })

  describe('7. Chart Utilities and Edge Case Defensive Handling', () => {
    it('getQuartiles computes quartiles correctly and handles edge cases safely', async () => {
      const { getQuartiles } = await import('../../utils')
      expect(getQuartiles([100, 150, 200])).toEqual([100, 125, 150, 175, 200])
      expect(getQuartiles([10])).toEqual([10, 10, 10, 10, 10])
      expect(getQuartiles(10)).toEqual([10, 10, 10, 10, 10])
      expect(getQuartiles([])).toEqual([NaN, NaN, NaN, NaN, NaN])
      expect(getQuartiles(null)).toEqual([NaN, NaN, NaN, NaN, NaN])
      expect(getQuartiles(undefined)).toEqual([NaN, NaN, NaN, NaN, NaN])
    })

    it('findColoring handles string, number, null, and undefined values safely', async () => {
      const { findColoring } = await import('../../utils')
      const colors = { East: '#ff0000', 0: '#00ff00' }
      expect(findColoring('East', colors)).toBe('#ff0000')
      expect(findColoring('East \u279D NY', colors)).toBe('#ff0000')
      expect(findColoring(0, colors)).toBe('#00ff00')
      expect(findColoring(null, colors)).toBeUndefined()
      expect(findColoring(undefined, colors)).toBeUndefined()
    })

    it('findSubgroupLabels extracts unique labels safely and handles malformed inputs', async () => {
      const { findSubgroupLabels } = await import('../../utils')
      const yValues = [
        [
          { name: 'Food', value: [10] },
          { name: 'Non-Food', value: [20] },
        ],
        [
          { name: 'Food', value: [30] },
          { name: 'Other', value: [40] },
        ],
      ]
      expect(findSubgroupLabels(yValues)).toEqual(['Food', 'Non-Food', 'Other'])
      expect(findSubgroupLabels([])).toEqual([])
      expect(findSubgroupLabels(null)).toEqual([])
      expect(findSubgroupLabels([[1], [0]])).toEqual([])
    })
  })
})
