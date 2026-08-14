import React from 'react'

import Loader from '../../../ui/views/common/Loader'

const loaderStories = {
  title: 'Views/Common/Loader',
  component: Loader,
  parameters: {
    layoutWidth: 'full',
  },
}

export default loaderStories

export const Loading = {
  render: () => <Loader />,
  parameters: {
    preloadedState: {
      utilities: {
        loading: {
          session_loading: true,
          data_loading: false,
          ignore_loading: false,
        },
      },
    },
  },
}

export const Hidden = {
  render: () => <Loader />,
  parameters: {
    preloadedState: {
      utilities: {
        loading: {
          session_loading: false,
          data_loading: false,
          ignore_loading: false,
        },
      },
    },
  },
}
