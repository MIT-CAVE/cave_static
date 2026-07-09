import React from 'react'

import PropPicture from '../ui/compound/PropPicture'
import PropVideo from '../ui/compound/PropVideo'

const propMediaStories = {
  title: 'Compound/PropMedia',
  component: PropPicture,
  parameters: {
    layoutWidth: '600px',
  },
}

export default propMediaStories

export const Picture = {
  render: (args) => <PropPicture {...args} />,
  args: {
    prop: {
      value:
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
    },
  },
}

export const Video = {
  render: (args) => <PropVideo {...args} />,
  args: {
    prop: {
      value: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      scaleMode: 'fitWidth',
    },
  },
}
