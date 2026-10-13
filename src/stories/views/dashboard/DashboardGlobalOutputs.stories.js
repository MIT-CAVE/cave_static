import React from 'react'
import { expect, waitFor } from 'storybook/test'

import DashboardGlobalOutput from '../../../ui/views/dashboard/DashboardGlobalOutputs'
import { chartVariant } from '../../../utils/enums'

const dashboardGlobalOutputsStories = {
  title: 'Views/Dashboard/GlobalOutputs',
  component: DashboardGlobalOutput,
  parameters: {
    layoutWidth: 'full',
    initData: {
      associated: {
        data: {
          first: {
            name: 'Scenario A',
            data: {
              globalOutputs: {
                props: {
                  revenue: { id: 'revenue', name: 'Revenue', value: 1000 },
                  cost: { id: 'cost', name: 'Cost', value: 600 },
                },
              },
            },
          },
          second: {
            name: 'Scenario B',
            data: {
              globalOutputs: {
                props: {
                  revenue: { id: 'revenue', name: 'Revenue', value: 1200 },
                  cost: { id: 'cost', name: 'Cost', value: 700 },
                },
              },
            },
          },
        },
      },
    },
  },
}

export default dashboardGlobalOutputsStories

export const TableRowsMatchOutputColumns = {
  render: () => (
    <DashboardGlobalOutput
      chartObj={{
        chartType: chartVariant.TABLE,
        globalOutput: ['cost', 'revenue'],
        sessions: ['Scenario A', 'Scenario B'],
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    await waitFor(() => {
      const rows = canvasElement.querySelectorAll('[role="row"][data-id]')
      expect(rows).toHaveLength(2)
      expect(
        canvasElement.querySelector('[role="columnheader"][data-field="cost"]')
          ?.textContent
      ).toContain('Cost')
      expect(
        canvasElement.querySelector(
          '[role="columnheader"][data-field="revenue"]'
        )?.textContent
      ).toContain('Revenue')
      expect(
        [...rows].map((row) =>
          ['session', 'cost', 'revenue'].map(
            (field) => row.querySelector(`[data-field="${field}"]`)?.textContent
          )
        )
      ).toEqual([
        ['Scenario A', '600.00', '1,000.00'],
        ['Scenario B', '700.00', '1,200.00'],
      ])
    })
  },
}
