import { Box, Grid, Paper, Typography } from '@mui/material'
import PropTypes from 'prop-types'

import HelpTooltip from './HelpTooltip'
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
    // p: 1,
  },
  info: {
    position: 'absolute',
    top: '8px',
    right: '8px',
  },
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
    minWidth: '1ch',
  },
  subtitle: {
    color: 'text.secondary',
  },
}

const BaseContainer = ({
  title,
  tooltipContent,
  elevation,
  style,
  sx = [],
  children,
  ...props
}) => (
  <Paper
    sx={[styles.base, style, ...forceArray(sx)]}
    {...{ elevation, ...props }}
  >
    {tooltipContent && (
      <HelpTooltip {...{ title }} content={tooltipContent} sx={styles.info} />
    )}
    {children}
  </Paper>
)

const PropHeader = ({
  title,
  subtitle,
  unit,
  marquee = true,
  titleVariant = 'subtitle1',
  ...props
}) => (
  <>
    <Grid container sx={{ alignSelf: 'center' }} {...props}>
      <Grid size="grow">
        <Typography noWrap={marquee} variant={titleVariant}>
          {marquee ? <OverflowText text={title} /> : title}
        </Typography>
      </Grid>
      {unit && (
        <Grid sx={{ maxWidth: '33.33%' }}>
          <Typography variant="subtitle2" sx={styles.unit}>
            <OverflowText text={unit} />
          </Typography>
        </Grid>
      )}
    </Grid>
    {subtitle && (
      <Typography variant="subtitle2" sx={styles.subtitle}>
        <OverflowText text={subtitle} />
      </Typography>
    )}
  </>
)

const HorizontalContainer = ({
  title,
  subtitle,
  marquee,
  tooltipContent,
  unit,
  children,
  ...props
}) => (
  <BaseContainer {...{ title, tooltipContent, ...props }}>
    <Grid
      container
      sx={{
        alignItems: 'center',
        alignContent: 'start',
        mt: tooltipContent ? 3.5 : 0,
        overflow: 'auto',
        height: '100%',
      }}
    >
      <Grid size="grow" sx={{ minWidth: '5ch', pl: 1 }}>
        <PropHeader {...{ title, subtitle, marquee, unit }} />
      </Grid>
      <Grid size={7.5}>{children}</Grid>
    </Grid>
  </BaseContainer>
)

const VerticalContainer = ({
  title,
  subtitle,
  marquee,
  tooltipContent,
  unit,
  sx = [],
  children,
  ...props
}) => (
  <BaseContainer
    {...{ title, tooltipContent, ...props }}
    sx={[{ p: 1 }, ...forceArray(sx)]}
  >
    <Grid container spacing={1} direction="column" sx={{ flexGrow: 1 }}>
      <Grid
        sx={{
          pl: 1,
          pt: 0.5,
          pr: tooltipContent ? 4.5 : 1,
          width: '100%',
        }}
      >
        <PropHeader {...{ title, subtitle, marquee, unit }} />
      </Grid>
      <Grid
        container
        size="grow"
        sx={{ alignItems: 'start', overflow: 'visible', p: 1 }}
      >
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
    <Grid container size="grow" sx={{ alignContent: 'start', mt: 3.5 }}>
      {children}
    </Grid>
  </BaseContainer>
)

const MinimalContainer = ({ style, children }) => (
  <Box
    sx={[
      styles.base,
      {
        justifyContent: 'start',
        p: 0,
        // border: '1px solid rgb(255 255 255 / .1)', // NOTE: Only for debugging
        // bgcolor: 'rgb(255 255 0 / .02)', // NOTE: Only for debugging
      },
      style,
    ]}
  >
    {children}
  </Box>
)

const PropContainer = ({
  type = propContainer.VERTICAL,
  title,
  subtitle,
  marquee,
  tooltipContent,
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
            : type === propContainer.MINIMAL
              ? MinimalContainer
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
        subtitle,
        marquee,
        tooltipContent,
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
  subtitle: PropTypes.string,
  marquee: PropTypes.bool,
  tooltipContent: PropTypes.string,
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
