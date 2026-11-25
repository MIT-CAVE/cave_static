import { Typography } from '@mui/material'
import { useContext } from 'react'

import ChartContext from './ChartContext'

import { forceArray } from '../../../../utils'
import RichLabel from '../../../compound/RichLabel'

const styles = {
  title: {
    flexShrink: 0,
    p: 1,
    bgcolor: 'background.paper',
    fontSize: 16,
    fontWeight: 'bold',
    color: '#eee',
  },
}

// The title of a chart, shown above its plot area for every chart type.
// `sx` adds to the default styles.
const ChartTitle = ({ sx = [] }) => {
  const { title, richTitle, richText } = useContext(ChartContext)
  if (!title) return null

  return (
    <Typography align="center" noWrap sx={[styles.title, ...forceArray(sx)]}>
      <RichLabel text={richTitle ?? title} rich={richText === true} />
    </Typography>
  )
}

export default ChartTitle
