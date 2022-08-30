module.exports = {
  '*.{json,css,html,md}': 'prettier --write',
  '*.{js,jsx}': ['prettier --write', 'eslint --max-warnings=0 --fix'],
}
