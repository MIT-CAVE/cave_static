import { styled } from '@mui/material'

// Inline code with a subtle background. The size is relative (`em`) to the text
// around it, so it can be used in labels of any size.
const InlineCode = styled('code')(({ theme }) => ({
  backgroundColor: theme.palette.action.hover,
  padding: theme.spacing(0, 0.5),
  borderRadius: 4,
  fontSize: '0.9em',
  fontFamily: 'Consolas, monospace',
}))

export default InlineCode
