import React from 'react'

import AppSettingsPane from '../../../ui/views/common/AppSettingsPane'

const appSettingsPaneStories = {
  title: 'Views/Common/AppSettingsPane',
  component: AppSettingsPane,
  parameters: {
    layoutWidth: '380px',
    layoutHeight: '600px',
  },
}

export default appSettingsPaneStories

export const Default = {
  render: () => <AppSettingsPane />,
  parameters: {
    preloadedState: {
      data: {
        globalOutputs: {
          props: {
            kpi1: {
              type: 'num',
              name: 'Total Revenue',
              draggable: true,
              unit: '$',
              precision: 2,
            },
          },
        },
        maps: {
          data: {
            map_1: { name: 'Logistics Grid' },
          },
        },
      },
      local: {
        settings: {
          demo: false,
          editLayout: false,
          mirror: false,
          sync: {},
        },
        panes: {
          data: {},
        },
      },
    },
  },
}
