/**
 * Downloads the given data as a JSON file with the given name.
 * @param {Object} data The data object to be downloaded.
 * @param {string} name The name of the file to be downloaded.
 */
const downloadJSON = (data, name) => {
  const reformmatedData = JSON.stringify(data, null, 2)
  const url = window.URL.createObjectURL(
    new Blob([reformmatedData], { type: 'application/json' })
  )
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `${name}.json`)
  document.body.appendChild(link)
  link.click()
}

export default downloadJSON
