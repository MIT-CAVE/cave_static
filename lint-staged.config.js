/**
 * @see https://github.com/lint-staged/lint-staged
 */
const config = {
  '*.{json,css,html,md}': 'prettier --write',
  'src/**/*.{js,jsx}': ['prettier --write', 'eslint --max-warnings=0 --fix'],
  '.storybook/**/*.js': 'prettier --write',
  '*.js': 'prettier --write',
}

export default config
