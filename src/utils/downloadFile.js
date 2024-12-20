/**
 * Downloads the given data as a JSON file with the given name.
 * @param {Object} data The data object to be downloaded.
 * @param {string} name The name of the file to be downloaded.
 */

const downloadFile = (data, name) => {
  const link = document.createElement('a')
  link.href = data
  link.setAttribute('download', `${name}`)
  document.body.appendChild(link)
  link.click()
}

export default downloadFile
