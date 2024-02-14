import { Box, Modal, Typography } from '@mui/material'

const styles = {
  root: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    mx: 'auto',
    p: 1,
  },
  paper: {
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    width: '700px',
    maxWidth: '60%',
    height: '800px',
    maxHeight: '60%',
    p: 2,
    color: 'text.primary',
    bgcolor: 'background.paper',
    border: 1,
    borderColor: 'text.secondary',
    borderRadius: 1,
    boxShadow: 5,
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    justifyContent: 'center',
    mb: 1,
    pt: 2,
  },
  headerExtra: {
    display: 'flex',
    justifyContent: 'center',
    fontWeight: 600,
    mb: 1,
    pb: 2,
  },
}

// TODO: This might replace `GeneralModal` and other modal wrappers
const BaseModal = ({
  open,
  label,
  labelExtra,
  slotProps,
  onClose,
  children,
}) => {
  const {
    root: { sx: sxRoot, ...rootProps },
    paper: { sx: sxPaper, ...paperProps },
  } = slotProps
  return (
    <Modal sx={[styles.root, sxRoot]} {...{ open, onClose }} {...rootProps}>
      <Box sx={[styles.paper, sxPaper]} {...paperProps}>
        <Typography sx={styles.header} component="span" variant="h5">
          {label}
        </Typography>
        {labelExtra && (
          <Typography sx={styles.headerExtra} component="span" color="primary">
            {labelExtra}
          </Typography>
        )}
        {children}
      </Box>
    </Modal>
  )
}

const DataGridModal = ({ open, ...props }) => (
  <BaseModal
    slotProps={{
      root: {
        // Keep the component mounted to avoid losing `apiRef`
        keepMounted: true,
      },
      paper: {
        // Preserve `apiRef` using `visibility`
        visibility: open ? 'visible' : 'hidden',
      },
    }}
    {...{ open, ...props }}
  />
)

export { DataGridModal }
export default BaseModal
