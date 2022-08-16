/** @jsxImportSource @emotion/react */
import { Grid, Paper, Typography } from '@mui/material'
import { makeStyles } from '@mui/styles'
import * as R from 'ramda'
import React, { memo } from 'react'
import { useSelector } from 'react-redux'

import {
  selectKeys,
  selectOpenPane,
  selectSecondaryOpenPane,
} from '../../../data/selectors'
import { APP_BAR_WIDTH, PANE_WIDTH } from '../../../utils/constants'

import { FetchedIcon, OverflowText } from '../../compound'

import { prettifyValue } from '../../../utils'

const useStyles = makeStyles((theme) => ({
  paper_root: {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.text.secondary}`,
    padding: theme.spacing(2),
    color: theme.palette.text.primary,
  },
  item_root: {
    padding: theme.spacing(1),
    // width: 'fit-content',
  },
  title: {
    padding: theme.spacing(0.5),
    whiteSpace: 'nowrap',
    width: '8vw',
  },
  icon_padding: {
    paddingRight: theme.spacing(1.5),
  },
}))

const localCss = {
  legend_root: (open, secondaryOpen) => ({
    position: 'absolute',
    left: `${
      APP_BAR_WIDTH +
      50 +
      (open ? PANE_WIDTH : 0) +
      (secondaryOpen ? PANE_WIDTH : 0)
    }px`,
    top: '10px',
    zIndex: 1,
  }),
}

const BREAKPOINTS = [
  [12],
  [6, 6],
  [4, 4, 4],
  [6, 6, 6, 6],
  [6, 6, 6, 6, 6],
  [4, 4, 4, 4, 4, 4],
]

const KeyPad = () => {
  const classes = useStyles()
  const open = useSelector(selectOpenPane)
  const secondaryOpen = useSelector(selectSecondaryOpenPane)
  const keys = useSelector(selectKeys)
  if (R.isEmpty(keys)) return null
  return (
    <div key="KeyPad" css={localCss.legend_root(open, secondaryOpen)}>
      <Paper elevation={7} className={classes.paper_root}>
        <Grid container spacing={2}>
          {keys.map(({ name, value, unit, icon }, index) => {
            return (
              <Grid
                zeroMinWidth
                key={index}
                item
                xs={BREAKPOINTS[keys.length - 1][index]}
              >
                <Paper elevation={7} className={classes.item_root}>
                  <Typography className={classes.title} variant="subtitle1">
                    <OverflowText text={name} />
                  </Typography>
                  <Grid
                    container
                    spacing={1.5}
                    alignItems="flex-start"
                    wrap="nowrap"
                  >
                    <Grid item>
                      <FetchedIcon
                        iconName={icon}
                        className={classes.icon_padding}
                      />
                    </Grid>
                    <Grid
                      item
                      xs="auto"
                      // Not sexy... a `fit-content`-based solution would be the best
                      css={{ minWidth: keys.length % 3 === 0 ? '150px' : 0 }}
                    >
                      {`${prettifyValue(value)} ${unit}`}
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            )
          })}
        </Grid>
      </Paper>
    </div>
  )
}

export default memo(KeyPad)
