import React from 'react'

import PropAudio from '../../ui/compound/PropAudio'
import PropPicture from '../../ui/compound/PropPicture'
import PropVideo from '../../ui/compound/PropVideo'

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

export const PictureFitWidth = {
  render: (args) => <PropPicture {...args} />,
  args: {
    prop: {
      value:
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
      scaleMode: 'fitWidth',
      helperText: 'A gradient picture scaled to the container width',
    },
  },
}

export const PictureFullWidth = {
  render: (args) => <PropPicture {...args} />,
  args: {
    prop: {
      value:
        'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?w=400',
      fullWidth: true,
    },
  },
}

export const VideoWithHelperText = {
  render: (args) => <PropVideo {...args} />,
  args: {
    prop: {
      value: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      fullWidth: true,
      helperText: 'Embedded video with a helper text',
    },
  },
}

const tallUrl = 'https://picsum.photos/id/237/300/600'
const wideUrl = 'https://picsum.photos/id/237/600/300'
const fixedCell = (Story) => (
  <div style={{ width: 400, height: 300, border: '1px dashed gray' }}>
    <Story />
  </div>
)
const pictureArgs = (value, scaleMode) => ({ prop: { value, scaleMode } })
const pictureRender = (args) => <PropPicture {...args} />

export const PictureTallFitContainer = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(tallUrl, 'fitContainer'),
}
export const PictureWideFitContainer = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(wideUrl, 'fitContainer'),
}
export const PictureTallFitHeight = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(tallUrl, 'fitHeight'),
}
export const PictureWideFitHeight = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(wideUrl, 'fitHeight'),
}
export const PictureTallFitWidth = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(tallUrl, 'fitWidth'),
}
export const PictureWideFitWidth = {
  render: pictureRender,
  decorators: [fixedCell],
  args: pictureArgs(wideUrl, 'fitWidth'),
}

export const Audio = {
  render: (args) => <PropAudio {...args} />,
  args: {
    prop: {
      // Satie's "Gymnopédie No. 1" (CC0, Wikimedia Commons)
      value:
        'https://upload.wikimedia.org/wikipedia/commons/b/b7/Gymnopedie_No._1..ogg',
      helperText: 'Erik Satie: Gymnopédie No. 1',
    },
  },
}
