import { TextField, Box, Button, Paper } from '@mui/material'
import * as R from 'ramda'
import { useState, useMemo } from 'react'

import { DataGridModal } from './BaseModal'

const ColorChangeModal = ({ open, label, onClose, chartObj, index, path }) => {
  const [searchText, setSearchText] = useState('')

  const handleChangeSearchText = (event) => {
    setSearchText(event.target.value)
  }

  const visibleGroupings = useMemo(() => {
    const containsSearchText = R.pipe(
      R.toLower,
      R.includes(searchText.toLowerCase())
    )
    const matchedCategories = []
    const findMatchedCategories = (cat) => {
      if (containsSearchText(cat)) {
        matchedCategories.push(cat)
      }
    }

    R.forEach(findMatchedCategories, [
      'Ontario',
      'Texas',
      'California',
      'New York',
      'Florida',
      'Illinois',
      'Washington',
      'Arizona',
      'Colorado',
      'Nevada',
      'Utah',
      'New Mexico',
      'Alaska',
      'Hawaii',
      'Maine',
      'Vermont',
      'New Hampshire',
      'Massachusetts',
      'Rhode Island',
      'Connecticut',
      'New Jersey',
      'Pennsylvania',
      'Delaware',
      'Maryland',
      'Virginia',
      'North Carolina',
      'South Carolina',
      'Georgia',
      'Alabama',
      'Tennessee',
      'Kentucky',
      'Ohio',
      'Michigan',
      'Indiana',
      'Wisconsin',
      'Minnesota',
      'Iowa',
      'Missouri',
      'Arkansas',
      'Louisiana',
      'Mississippi',
      'North Dakota',
      'South Dakota',
      'Nebraska',
      'Kansas',
      'Oklahoma',
      'Texas',
    ])
    return matchedCategories
  }, [searchText])

  return (
    <DataGridModal
      slotProps={{
        paper: {
          sx: {
            width: '400px',
            height: '900px',
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          },
        },
      }}
      {...{ label, open, onClose }}
    >
      <TextField
        placeholder="Search final category level"
        label="Search"
        value={searchText}
        onChange={handleChangeSearchText}
      />
      <Box
        display="flex"
        flexDirection="column-reverse"
        gap={2}
        sx={{ overflow: 'auto' }}
      >
        {R.map((category) => {
          return (
            <Paper key={category}>
              <Button fullWidth color="greyscale">
                {category}
              </Button>
            </Paper>
          )
        })(visibleGroupings)}
      </Box>
    </DataGridModal>
  )
}

export default ColorChangeModal
