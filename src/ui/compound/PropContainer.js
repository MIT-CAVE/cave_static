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
    flexDirection: 'column',
    position: 'relative',
    justifyContent: 'space-between',
    p: 1,
  },
  info: (theme) => ({
    top: theme.spacing(1),
    right: theme.spacing(1),
    position: 'absolute',
  }),
  unit: {
    display: 'flex',
    alignSelf: 'end',
    ml: 1.5,
    mb: 1,
    px: 1.25,
    border: 1,
    borderRadius: 1,
    borderColor: 'text.secondary',
    fontWeight: 700,
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
  marquee,
  titleVariant = 'subtitle1',
  ...props
}) => (
  <Grid container maxWidth={PROP_WIDTH} alignSelf="center" {...props}>
    <Grid item zeroMinWidth xs>
      <Typography noWrap={marquee} variant={titleVariant}>
        {true ? <OverflowText text={title} /> : title}
      </Typography>
    </Grid>
    {unit && (
      <Grid item maxWidth="33.33%">
        <Typography variant="subtitle1" sx={styles.unit}>
          <OverflowText text={unit} />
        </Typography>
      </Grid>
    )}
  </Grid>
)

const HorizontalContainer = ({
  title,
  marquee = true,
  unit,
  children,
  ...props
}) => (
  <BaseContainer {...props}>
    <Grid container alignItems="center">
      <Grid item maxWidth={PROP_WIDTH / 2} paddingLeft={1} marginRight={3}>
        <PropTitle {...{ title, marquee, unit }} />
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
  unit,
  children,
  ...props
}) => (
  <BaseContainer {...{ tooltipTitle, ...props }}>
    <Grid container direction="column" flexGrow={1}>
      <Grid
        item
        paddingLeft={1}
        paddingTop={0.5}
        paddingRight={tooltipTitle ? 4.5 : 1}
      >
        <PropTitle {...{ title, marquee, unit }} />
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
