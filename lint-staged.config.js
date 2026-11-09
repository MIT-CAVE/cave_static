/**
 * @see https://github.com/lint-staged/lint-staged
 */
// `--no-error-on-unmatched-pattern`: `oxfmt` exits non-zero when every staged
// file is ignored (e.g. only `package-lock.json` is staged), which would
// otherwise block the commit.
const oxfmt = 'oxfmt --no-error-on-unmatched-pattern'

const config = {
  '*.{json,css,html,md}': oxfmt,
  'src/**/*.{js,jsx}': [oxfmt, 'oxlint --max-warnings=0 --fix'],
  '.storybook/**/*.js': oxfmt,
  '*.js': oxfmt,
}

export default config
