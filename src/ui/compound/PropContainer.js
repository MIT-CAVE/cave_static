import { Box, Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import InfoButton from './InfoButton'
import OverflowText from './OverflowText'

import { PROP_WIDTH } from '../../utils/constants'
import { propContainer } from '../../utils/enums'

import { forceArray } from '../../utils'

const styles = {
  base: {
    display: 'flex',
    position: 'relative',
    justifyContent: 'center',
    p: 1,
  },
  info: (theme) => ({
    top: theme.spacing(1),
    right: theme.spacing(1),
    position: 'absolute',
  }),
}

const BaseContainer = ({
  tooltipTitle,
  elevation,
  style,
  sx,
  children,
  ...props
}) => (
  <Paper
    sx={[styles.base, style, ...forceArray(sx)]}
    {...{ elevation, ...props }}
  >
    {tooltipTitle && (
      <Box sx={styles.info}>
        <InfoButton text={tooltipTitle} />
      </Box>
    )}
    {children}
  </Paper>
)

const PropTitle = ({
  title,
  marquee,
  titleVariant = 'subtitle1',
  ...props
}) => (
  <Grid container alignSelf="center" {...props}>
    <Typography noWrap={marquee} variant={titleVariant}>
      {marquee ? <OverflowText text={title} /> : title}
    </Typography>
  </Grid>
)

const HorizontalContainer = ({ title, marquee, children, ...props }) => (
  <BaseContainer {...props}>
    <Grid container alignItems="center">
      <Grid item maxWidth={PROP_WIDTH / 2} paddingLeft={1} marginRight={3}>
        <PropTitle {...{ title, marquee }} />
      </Grid>
      <Grid item xs minWidth={PROP_WIDTH} paddingTop={1}>
        {children}
      </Grid>
    </Grid>
  </BaseContainer>
)

const VerticalContainer = ({
  title,
  marquee,
  tooltipTitle,
  children,
  ...props
}) => (
  <BaseContainer {...{ tooltipTitle, ...props }}>
    <Grid container direction="column">
      <Grid
        item
        paddingLeft={1}
        paddingTop={0.5}
        paddingRight={tooltipTitle ? 4.5 : 1}
      >
        <PropTitle {...{ title, marquee }} />
      </Grid>
      <Grid container item xs alignItems="center">
        {children}
      </Grid>
    </Grid>
  </BaseContainer>
)

const TitledContainer = ({ elevation = 0, sx, ...props }) => (
  <VerticalContainer
    sx={[{ border: 1, borderColor: 'grey.500' }, ...forceArray(sx)]}
    {...{ elevation, ...props }}
  />
)

const UntitledContainer = ({ children, ...props }) => (
  <BaseContainer {...props}>
    <Grid container alignItems="center" xs>
      {children}
    </Grid>
  </BaseContainer>
)

const PropContainer = ({
  type = propContainer.VERTICAL,
  title,
  marquee,
  tooltipTitle,
  elevation,
  style,
  sx = [],
  children,
  ...props
}) => {
  const LayoutContainer =
    type === propContainer.VERTICAL
      ? VerticalContainer
      : type === propContainer.HORIZONTAL
      ? HorizontalContainer
      : type === propContainer.TITLED
      ? TitledContainer
      : type === propContainer.UNTITLED
      ? UntitledContainer
      : type === propContainer.NONE
      ? null
      : () => {
          throw Error(`Invalid type '${type}' for prop container`)
        }
  if (LayoutContainer == null) return children

  return (
    <LayoutContainer
      {...{ title, marquee, tooltipTitle, elevation, style, sx, ...props }}
    >
      {children}
    </LayoutContainer>
  )
}
PropContainer.propTypes = {
  title: PropTypes.string,
  marquee: PropTypes.bool,
  tooltipTitle: PropTypes.string,
  type: PropTypes.oneOf(Object.values(propContainer)),
  elevation: PropTypes.oneOf([...Array(25).keys()]),
  style: PropTypes.object,
  sx: PropTypes.oneOfType([
    PropTypes.arrayOf(
      PropTypes.oneOfType([PropTypes.func, PropTypes.object, PropTypes.bool])
    ),
    PropTypes.func,
    PropTypes.object,
  ]),
  props: PropTypes.object,
  children: PropTypes.node,
}

export default PropContainer
