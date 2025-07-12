import { IconButton, Tooltip } from '@mui/material'
import { useCallback, useState } from 'react'
import { MdCheck, MdContentCopy } from 'react-icons/md'

const CopyButton = ({
  tooltip,
  icon: Icon = MdContentCopy,
  size = 20,
  getText,
}) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = useCallback(async () => {
    const text = getText()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [getText])

  return (
    <Tooltip title={copied ? 'Copied!' : tooltip}>
      <IconButton size="small" onClick={handleCopy}>
        {copied ? <MdCheck {...{ size }} /> : <Icon {...{ size }} />}
      </IconButton>
    </Tooltip>
  )
}

export default CopyButton
