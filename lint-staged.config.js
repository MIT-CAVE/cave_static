/**
 * @see https://github.com/lint-staged/lint-staged
 */
const config = {
  '*.{json,css,html,md}': 'prettier --write',
  '*.{js,jsx}': ['prettier --write', 'eslint --max-warnings=0 --fix'],
}

export default config
