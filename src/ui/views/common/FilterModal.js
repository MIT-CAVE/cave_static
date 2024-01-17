import {
  Modal,
  Paper,
  Card,
  Autocomplete,
  TextField,
  CardActions,
  Stack,
  Button,
  Box,
  Grid,
  ButtonGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material'
import * as R from 'ramda'
import { useState } from 'react'
import { useSelector } from 'react-redux'

import {
  selectNumberFormatPropsFn,
  selectNumberFormat,
} from '../../../data/selectors'
import { APP_BAR_WIDTH } from '../../../utils/constants'

import { FetchedIcon, NumberInput } from '../../compound'

const styles = {
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    ml: 'auto',
    mr: 'auto',
    p: 1,
  },
  paper: {
    position: 'absolute',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    bgcolor: 'background.paper',
    boxShadow: 5,
    p: (theme) => theme.spacing(2, 4, 3),
    color: 'text.primary',
    width: '30vw',
    maxHeight: `calc(100vh - ${2 * APP_BAR_WIDTH + 1}px)`,
    overflow: 'auto',
    ml: 'auto',
    mr: 'auto',
    pb: 4,
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    p: 2.5,
    fontSize: '25px',
    borderColor: 'text.secondary',
    borderBottom: '2px',
  },
}

const FilterModal = ({
  filterOpen,
  setFilterOpen,
  filterableProps,
  currentFilters,
  updateFilters,
  chartObj = {},
}) => {
  const [filterToAdd, setFilterToAdd] = useState({})
  const getNumberFormat = useSelector(selectNumberFormatPropsFn)
  const numberFormat = useSelector(selectNumberFormat)
  const format = R.propOr('stat', 'format', filterToAdd)
  const type =
    format === 'stat' && !R.isEmpty(chartObj)
      ? 'num'
      : !R.isEmpty(chartObj)
        ? 'selector'
        : R.pathOr('', [filterToAdd['prop'], 'type'])(filterableProps)
  return (
    <Modal
      open={filterOpen}
      onClose={() => {
        setFilterOpen(false)
      }}
      sx={styles.modal}
    >
      <Box sx={styles.paper}>
        <Box sx={styles.header}>{'Filter'}</Box>
        <Paper sx={{ textAlign: 'center', pb: 1 }}>
          <Card elevation={10}>
            {!R.isEmpty(chartObj) && (
              <Autocomplete
                sx={{ m: 2 }}
                autoSelect
                disablePortal
                value={format}
                options={[
                  'stat',
                  ...R.keys(R.prop('categories')(filterableProps)),
                ]}
                renderInput={(params) => (
                  <TextField label={'Filter Type'} {...params} />
                )}
                onChange={(_, value) => {
                  setFilterToAdd(R.assoc('format', value, filterToAdd))
                }}
                getOptionLabel={(option) =>
                  option === 'stat'
                    ? 'Statistic'
                    : R.pathOr(option, [option, 'name'])(
                        R.prop('categories', filterableProps)
                      )
                }
              />
            )}
            <Grid container spacing={2} alignItems={'center'}>
              <Grid item xs={5}>
                <Autocomplete
                  sx={{ m: 2 }}
                  autoSelect
                  disablePortal
                  value={R.propOr('', 'prop', filterToAdd)}
                  options={
                    R.isEmpty(chartObj)
                      ? R.keys(filterableProps)
                      : format === 'stat'
                        ? R.keys(filterableProps['statNames'])
                        : R.keys(
                            filterableProps['categories'][format]['levels']
                          )
                  }
                  renderInput={(params) => (
                    <TextField
                      label={
                        R.isEmpty(chartObj)
                          ? 'Prop'
                          : format === 'stat'
                            ? 'Statistic'
                            : R.pathOr(format, ['categories', format, 'name'])(
                                filterableProps
                              )
                      }
                      {...params}
                    />
                  )}
                  onChange={(_, value) => {
                    setFilterToAdd({
                      prop: value,
                      format: filterToAdd['format'],
                    })
                  }}
                  getOptionLabel={(option) =>
                    R.isEmpty(chartObj) || format === 'stat'
                      ? R.pathOr(option, [option, 'name'])(filterableProps)
                      : R.pathOr(option, [
                          'categories',
                          format,
                          'levels',
                          option,
                          'name',
                        ])(filterableProps)
                  }
                />
              </Grid>
              {R.has('prop', filterToAdd) && type === 'num' ? (
                <>
                  <Grid item xs={2}>
                    <ButtonGroup aria-label="button group">
                      <Button
                        variant={
                          R.propEq('eq', 'option', filterToAdd)
                            ? 'contained'
                            : 'outlined'
                        }
                        onClick={() => {
                          filterToAdd['option'] === 'eq'
                            ? setFilterToAdd(R.dissoc('option', filterToAdd))
                            : setFilterToAdd(
                                R.assoc('option', 'eq', filterToAdd)
                              )
                        }}
                      >
                        =
                      </Button>
                      <Button
                        variant={
                          R.propEq('gte', 'option', filterToAdd)
                            ? 'contained'
                            : 'outlined'
                        }
                        onClick={() => {
                          filterToAdd['option'] === 'gte'
                            ? setFilterToAdd(R.dissoc('option', filterToAdd))
                            : setFilterToAdd(
                                R.assoc('option', 'gte', filterToAdd)
                              )
                        }}
                      >
                        &ge;
                      </Button>
                      <Button
                        variant={
                          R.propEq('gt', 'option', filterToAdd)
                            ? 'contained'
                            : 'outlined'
                        }
                        onClick={() => {
                          filterToAdd['option'] === 'gt'
                            ? setFilterToAdd(R.dissoc('option', filterToAdd))
                            : setFilterToAdd(
                                R.assoc('option', 'gt', filterToAdd)
                              )
                        }}
                      >
                        &gt;
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item xs={5}>
                    <Box sx={{ m: 2 }}>
                      <NumberInput
                        enabled={type !== 'num' || R.has('option', filterToAdd)}
                        numberFormat={
                          R.isEmpty(chartObj)
                            ? getNumberFormat(
                                filterableProps[filterToAdd['prop']]
                              )
                            : numberFormat
                        }
                        value={
                          R.has('option', filterToAdd)
                            ? filterToAdd['value']
                            : ''
                        }
                        onClickAway={(value) => {
                          setFilterToAdd(R.assoc('value', value, filterToAdd))
                        }}
                      />
                    </Box>
                  </Grid>
                </>
              ) : type ===
                // TODO: replace this with the multiautocomplete that is in progress
                // This will require changes in data display as well
                'selector' ? (
                <>
                  <Grid item xs={2}>
                    <ButtonGroup aria-label="button group">
                      <Button
                        variant={
                          R.propEq('exc', 'option', filterToAdd)
                            ? 'outlined'
                            : 'contained'
                        }
                        onClick={() => {
                          setFilterToAdd(R.dissoc('option', filterToAdd))
                        }}
                      >
                        Inc
                      </Button>
                      <Button
                        variant={
                          R.propEq('exc', 'option', filterToAdd)
                            ? 'contained'
                            : 'outlined'
                        }
                        onClick={() => {
                          setFilterToAdd(R.assoc('option', 'exc', filterToAdd))
                        }}
                      >
                        Exc
                      </Button>
                    </ButtonGroup>
                  </Grid>
                  <Grid item xs={5}>
                    {R.values(
                      R.mapObjIndexed(({ name: label }, key) => (
                        <FormControlLabel
                          {...{ key, label }}
                          sx={{ pl: 1 }}
                          control={
                            <Checkbox
                              checked={R.includes(key)(
                                R.propOr([], 'value', filterToAdd)
                              )}
                              onClick={() => {
                                const checked = R.includes(
                                  key,
                                  R.propOr([], 'value', filterToAdd)
                                )
                                setFilterToAdd(
                                  checked
                                    ? R.assoc(
                                        'value',
                                        R.without([key], filterToAdd['value']),
                                        filterToAdd
                                      )
                                    : R.assoc(
                                        'value',
                                        R.append(key, filterToAdd['value']),
                                        filterToAdd
                                      )
                                )
                              }}
                            />
                          }
                        />
                      ))(
                        R.isEmpty(chartObj)
                          ? R.pathOr({}, [filterToAdd['prop'], 'options'])(
                              filterableProps
                            )
                          : R.pipe(
                              R.pathOr(
                                [],
                                [
                                  'categories',
                                  format,
                                  'data',
                                  filterToAdd['prop'],
                                ]
                              ),
                              (d) => {
                                const acc = {}
                                for (const value of d) {
                                  acc[value] = { name: value }
                                }
                                return acc
                              }
                            )(filterableProps)
                      )
                    )}
                  </Grid>
                </>
              ) : type === 'toggle' ? (
                <>
                  <Grid item xs={2}>
                    =
                  </Grid>
                  <Grid item xs={5}>
                    <Autocomplete
                      sx={{ m: 2 }}
                      autoSelect
                      disablePortal
                      value={R.propOr('', 'value', filterToAdd)}
                      options={[true, false]}
                      renderInput={(params) => (
                        <TextField label={'Value'} {...params} />
                      )}
                      onChange={(_, value) => {
                        setFilterToAdd(R.assoc('value', value, filterToAdd))
                      }}
                      getOptionLabel={(option) =>
                        option.toString().charAt(0).toUpperCase() +
                        option.toString().slice(1)
                      }
                    />
                  </Grid>
                </>
              ) : (
                []
              )}
            </Grid>
            {R.has('prop', filterToAdd) && type === 'num' && (
              <Grid container>
                <Grid item xs={5}></Grid>
                <Grid item xs={2} sx={{ mt: 3 }}>
                  <ButtonGroup
                    aria-label="button group"
                    disabled={R.propEq('eq', 'option', filterToAdd)}
                  >
                    <Button
                      variant={
                        R.propEq('lte', 'option1', filterToAdd)
                          ? 'contained'
                          : 'outlined'
                      }
                      onClick={() => {
                        filterToAdd['option1'] === 'lte'
                          ? setFilterToAdd(R.dissoc('option1', filterToAdd))
                          : setFilterToAdd(
                              R.assoc('option1', 'lte', filterToAdd)
                            )
                      }}
                    >
                      &le;
                    </Button>
                    <Button
                      variant={
                        R.propEq('lt', 'option1', filterToAdd)
                          ? 'contained'
                          : 'outlined'
                      }
                      onClick={() => {
                        filterToAdd['option1'] === 'lt'
                          ? setFilterToAdd(R.dissoc('option1', filterToAdd))
                          : setFilterToAdd(
                              R.assoc('option1', 'lt', filterToAdd)
                            )
                      }}
                    >
                      &lt;
                    </Button>
                  </ButtonGroup>
                </Grid>
                <Grid item xs={5}>
                  <Box sx={{ m: 2 }}>
                    <NumberInput
                      enabled={
                        R.has('option1', filterToAdd) &&
                        !R.propEq('eq', 'option', filterToAdd)
                      }
                      numberFormat={
                        R.isEmpty(chartObj)
                          ? getNumberFormat(
                              filterableProps[filterToAdd['prop']]
                            )
                          : numberFormat
                      }
                      value={
                        R.has('option1', filterToAdd) &&
                        !R.propEq('eq', 'option', filterToAdd)
                          ? filterToAdd['value1']
                          : ''
                      }
                      onClickAway={(value) => {
                        setFilterToAdd(R.assoc('value1', value, filterToAdd))
                      }}
                    />
                  </Box>
                </Grid>
              </Grid>
            )}
            <CardActions
              disableSpacing
              sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0 }}
            >
              <Stack direction="row" spacing={1} paddingBottom={0.75}>
                <Button
                  disabled={
                    type === 'num'
                      ? !(
                          (R.has('option', filterToAdd) &&
                            R.has('value', filterToAdd)) ||
                          (R.has('option1', filterToAdd) &&
                            R.has('value1', filterToAdd))
                        )
                      : !R.allPass([
                          R.has('prop'),
                          R.has('value'),
                          R.pipe(R.prop('value'), R.isEmpty, R.not),
                        ])(filterToAdd)
                  }
                  aria-label="confirm changes"
                  onClick={() => {
                    updateFilters(R.append(filterToAdd, currentFilters))
                    setFilterToAdd({})
                  }}
                  variant="contained"
                >
                  <FetchedIcon iconName="md/MdCheck" size={24} />
                </Button>
              </Stack>
            </CardActions>
          </Card>
          {R.map((filterObj) => {
            const { prop, value, option, option1, value1 } = filterObj
            const format = R.propOr('stat', 'format', filterObj)
            const type =
              format === 'stat' && !R.isEmpty(chartObj)
                ? 'num'
                : !R.isEmpty(chartObj)
                  ? 'selector'
                  : R.pathOr('', [filterToAdd['prop'], 'type'])(filterableProps)
            return (
              <Card
                key={prop}
                elevation={10}
                sx={{
                  m: 2,
                  p: 2,
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <Grid container spacing={2} alignItems={'center'}>
                  <Grid item xs={4}>
                    {R.isEmpty(chartObj) || format === 'stat'
                      ? R.pathOr(prop, [prop, 'name'])(filterableProps)
                      : R.pathOr(prop, [
                          'categories',
                          format,
                          'levels',
                          prop,
                          'name',
                        ])(filterableProps)}
                  </Grid>
                  {(type !== 'num' || R.isNotNil(option)) && (
                    <Grid item xs={type === 'num' ? 1 : 2}>
                      {type === 'num' ? (
                        option === 'gte' ? (
                          <>&ge;</>
                        ) : option === 'gt' ? (
                          <>&gt;</>
                        ) : (
                          '='
                        )
                      ) : type === 'selector' ? (
                        option === 'exc' ? (
                          'Excludes'
                        ) : (
                          'Includes'
                        )
                      ) : (
                        '='
                      )}
                    </Grid>
                  )}

                  {(type !== 'num' || R.isNotNil(option)) && (
                    <Grid item xs>
                      {type === 'num' && R.isNotNil(option) ? (
                        <NumberInput
                          enabled={false}
                          numberFormat={
                            R.isEmpty(chartObj)
                              ? getNumberFormat(filterableProps[prop])
                              : numberFormat
                          }
                          value={value}
                        />
                      ) : type === 'selector' ? (
                        R.values(
                          R.mapObjIndexed(({ name: label }, key) => (
                            <FormControlLabel
                              {...{ key, label }}
                              control={
                                <Checkbox
                                  checked={R.includes(key)(value)}
                                  disabled
                                />
                              }
                            />
                          ))(
                            R.isEmpty(chartObj)
                              ? R.pathOr({}, [prop, 'options'])(filterableProps)
                              : R.pipe(
                                  R.pathOr(
                                    [],
                                    ['categories', format, 'data', prop]
                                  ),
                                  (d) => {
                                    const acc = {}
                                    for (const value of d) {
                                      acc[value] = { name: value }
                                    }
                                    return acc
                                  }
                                )(filterableProps)
                          )
                        )
                      ) : (
                        value.toString().charAt(0).toUpperCase() +
                        value.toString().slice(1)
                      )}
                    </Grid>
                  )}
                  {type === 'num' && option1 && option !== 'eq' && (
                    <>
                      <Grid item xs={1}>
                        {option1 === 'lte' ? (
                          <> &le;</>
                        ) : option1 === 'lt' ? (
                          <> &lt;</>
                        ) : (
                          ''
                        )}
                      </Grid>
                      <Grid item xs>
                        <NumberInput
                          enabled={false}
                          numberFormat={
                            R.isEmpty(chartObj)
                              ? getNumberFormat(filterableProps[prop])
                              : numberFormat
                          }
                          value={value1}
                        />
                      </Grid>
                    </>
                  )}
                  <Grid item xs={2}>
                    <Button
                      aria-label="delete filter"
                      onClick={() => {
                        updateFilters(R.without([filterObj], currentFilters))
                      }}
                      variant="contained"
                    >
                      <FetchedIcon iconName="md/MdDelete" size={24} />
                    </Button>
                  </Grid>
                </Grid>
              </Card>
            )
          })(currentFilters)}
        </Paper>
      </Box>
    </Modal>
  )
}

export default FilterModal
