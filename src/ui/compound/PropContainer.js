import { Box, Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import InfoButton from './InfoButton'
import OverflowText from './OverflowText'

import { PROP_MIN_WIDTH } from '../../utils/constants'
import { propContainer } from '../../utils/enums'

import { forceArray } from '../../utils'

const styles = {
  base: {
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    justifyContent: 'center',
    minWidth: PROP_MIN_WIDTH,
    boxSizing: 'border-box',
    p: 1,
  },
  info: (theme) => ({
    top: theme.spacing(1),
    right: theme.spacing(1),
    position: 'absolute',
    mb: 1,
  }),
  unit: {
    display: 'flex',
    alignSelf: 'end',
    mx: 0.5,
    px: 1.25,
    border: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
    justifyContent: 'center',
  },
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
  unit,
  marquee = true,
  titleVariant = 'subtitle1',
  ...props
}) => (
  <Grid container alignSelf="center" {...props}>
    <Grid item zeroMinWidth xs>
      <Typography noWrap={marquee} variant={titleVariant}>
        {marquee ? <OverflowText text={title} /> : title}
      </Typography>
    </Grid>
    {unit && (
      <Grid item zeroMinWidth maxWidth="33.33%">
        <Typography variant="subtitle1" minWidth="1ch" sx={[styles.unit, {}]}>
          <OverflowText text={unit} />
        </Typography>
      </Grid>
    )}
  </Grid>
)

const HorizontalContainer = ({
  title,
  marquee,
  tooltipTitle,
  unit,
  children,
  ...props
}) => (
  <BaseContainer {...{ tooltipTitle, ...props }}>
    <Grid
      container
      alignItems="center"
      mt={tooltipTitle ? 3.5 : 0}
      overflow="auto"
      height="100%"
    >
      <Grid item zeroMinWidth xs minWidth="5ch" pl={1}>
        <PropTitle {...{ title, marquee, unit }} />
      </Grid>
      <Grid item xs={7.5}>
        {children}
      </Grid>
    </Grid>
  </BaseContainer>
)

const VerticalContainer = ({
  title,
  marquee,
  tooltipTitle,
  unit,
  children,
  ...props
}) => (
  <BaseContainer {...{ tooltipTitle, ...props }}>
    <Grid container direction="column" flexGrow={1}>
      <Grid item pl={1} pt={0.5} pr={tooltipTitle ? 4.5 : 1} width="100%">
        <PropTitle {...{ title, marquee, unit }} />
      </Grid>
      <Grid item container alignItems="center" overflow="auto" flexGrow={1}>
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
    <Grid container alignItems="center" item xs>
      {children}
    </Grid>
  </BaseContainer>
)

const PropContainer = ({
  type = propContainer.VERTICAL,
  title,
  marquee,
  tooltipTitle,
  unit,
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
      {...{
        title,
        marquee,
        tooltipTitle,
        unit,
        elevation,
        style,
        sx,
        ...props,
      }}
    >
      {children}
    </LayoutContainer>
  )
}
PropContainer.propTypes = {
  title: PropTypes.string,
  marquee: PropTypes.bool,
  tooltipTitle: PropTypes.string,
  unit: PropTypes.string,
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
