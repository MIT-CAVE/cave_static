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

    it('handles large datasets (e.g. >100,000 items) for min and max without call stack overflow', async () => {
      const count = 150000
      const largeValues = new Array(count)
      for (let i = 0; i < count; i++) largeValues[i] = i + 10
      largeValues[0] = 5
      largeValues[count - 1] = 999999

      const largeState = {
        data: {
          groupedOutputs: {
            groupings: {},
            data: {
              largeData: {
                stats: { val: { name: 'Value' } },
                valueLists: { val: largeValues },
                groupLists: {},
              },
            },
          },
        },
      }
      const largeChartFunc = selectMemoizedChartFunc(largeState)

      const minResult = await largeChartFunc({
        chartType: chartVariant.BAR,
        dataset: 'largeData',
        groupingId: [],
        groupingLevel: [],
        stats: [{ statId: 'val', aggregationType: 'min' }],
      })
      expect(minResult).toEqual([{ name: 'All', value: [5] }])

      const maxResult = await largeChartFunc({
        chartType: chartVariant.BAR,
        dataset: 'largeData',
        groupingId: [],
        groupingLevel: [],
        stats: [{ statId: 'val', aggregationType: 'max' }],
      })
      expect(maxResult).toEqual([{ name: 'All', value: [999999] }])
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

    it('getYExtremes computes min and max correctly without flooring yMax at 0 for negative ranges', async () => {
      const { getYExtremes, getDecimalScaleFactor, getDecimalScaleLabel } =
        await import('../../utils')

      // All negative values: yMax should be the highest negative value (-1000000), not floored at 0
      const negativeSeries = [{ data: [-5000000, -2000000, -1000000] }]
      const [negMin, negMax] = getYExtremes(negativeSeries)
      expect(negMin).toBe(-5000000)
      expect(negMax).toBe(-1000000)

      // Range scales properly to millions based on the maximum magnitude
      const maxMagnitude = Math.max(Math.abs(negMin), Math.abs(negMax))
      expect(getDecimalScaleFactor(maxMagnitude)).toBe(1000000)
      expect(getDecimalScaleLabel(maxMagnitude)).toBe('millions')

      // VisualMap array format [[x, y], ...]
      const visualMapSeries = [
        {
          data: [
            [0, -4000000],
            [1, -1500000],
          ],
        },
      ]
      const [vmMin, vmMax] = getYExtremes(visualMapSeries)
      expect(vmMin).toBe(-4000000)
      expect(vmMax).toBe(-1500000)

      // Mixed negative and positive range
      const mixedSeries = [{ data: [-3000000, 1000000] }]
      const [mixMin, mixMax] = getYExtremes(mixedSeries)
      expect(mixMin).toBe(-3000000)
      expect(mixMax).toBe(1000000)
      const mixedMagnitude = Math.max(Math.abs(mixMin), Math.abs(mixMax))
      expect(getDecimalScaleFactor(mixedMagnitude)).toBe(1000000)
      expect(getDecimalScaleLabel(mixedMagnitude)).toBe('millions')

      // Empty or non-numeric series safely defaults to [0, 0]
      expect(getYExtremes([])).toEqual([0, 0])
      expect(getYExtremes([{ data: [] }])).toEqual([0, 0])
      expect(getYExtremes([{ data: [NaN, null, undefined] }])).toEqual([0, 0])
      expect(getYExtremes(null)).toEqual([0, 0])
    })

    it('filterGroupedOutputs uses exact matching and does not exclude prefix substrings like Week 1 vs Week 13', async () => {
      const { filterGroupedOutputs } = await import('../../utils')
      const statistics = {
        valueLists: {
          val: [10, 20, 30, 40],
        },
        groupLists: {
          time_period: ['W1', 'W10', 'W13', 'W2'],
        },
      }
      const groupingIndices = {
        time_period: {
          data: {
            id: { W1: 0, W10: 1, W13: 2, W2: 3 },
            week: ['Week 1', 'Week 10', 'Week 13', 'Week 2'],
          },
        },
      }

      // Filter excluding 'Week 1' and 'Week 2' should keep 'Week 10' and 'Week 13' (not match as substring)
      const excludeFilter = [
        {
          format: 'time_period',
          prop: 'week',
          value: ['Week 1', 'Week 2'],
          option: 'exc',
        },
      ]
      const excBuffer = filterGroupedOutputs(
        statistics,
        excludeFilter,
        groupingIndices
      )
      const excView = new Uint32Array(excBuffer)
      expect(Array.from(excView)).toEqual([1, 2]) // indices for W10 and W13

      // Filter including 'Week 13' should only keep 'Week 13'
      const includeFilter = [
        {
          format: 'time_period',
          prop: 'week',
          value: ['Week 13'],
          option: 'inc',
        },
      ]
      const incBuffer = filterGroupedOutputs(
        statistics,
        includeFilter,
        groupingIndices
      )
      const incView = new Uint32Array(incBuffer)
      expect(Array.from(incView)).toEqual([2]) // index for W13
    })
  })
})
