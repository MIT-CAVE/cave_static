// How many of each unit make up the next one up, which a step has to divide
// evenly (e.g. a step of 7 minutes would not restart on the hour)
const STEP_LIMITS = { hours: 24, minutes: 60, seconds: 60 }

// A step only restricts anything if it is an integer above 1 that divides the
// unit evenly. Anything else is dropped so that a bad value can't break the prop.
const getValidStep = (step, unit) =>
  Number.isInteger(step) && step > 1 && STEP_LIMITS[unit] % step === 0
    ? step
    : undefined

/**
 * Gets the picker props that apply the `hoursStep`, `minutesStep` and
 * `secondsStep` of a `date` prop.
 *
 * The `minutes` step is native to the picker, which also snaps the clock to it.
 * The picker has no `hours` or `seconds` step, so those disable the values that
 * are not a multiple of the step in the corresponding view instead.
 */
export const getTimeStepProps = (prop) => {
  const hours = getValidStep(prop.hoursStep, 'hours')
  const minutes = getValidStep(prop.minutesStep, 'minutes')
  const seconds = getValidStep(prop.secondsStep, 'seconds')
  return {
    ...(minutes && { minutesStep: minutes }),
    ...((hours || seconds) && {
      shouldDisableTime: (value, view) =>
        (view === 'hours' && Boolean(hours) && value.hour() % hours !== 0) ||
        (view === 'seconds' &&
          Boolean(seconds) &&
          value.second() % seconds !== 0),
    }),
  }
}
