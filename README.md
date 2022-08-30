# cave_static
A react based static web app to be used as a data consumer for the `cave_app`.

## License Notice

Copyright 2022 Massachusetts Institute of Technology (MIT), Center for Transportation & Logistics (CTL)

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## Installation

Before you begin we suggest you use the version of node that this application version was developed on. We recommend using [NVM](https://github.com/nvm-sh/nvm#install--update-script) to manage node environments.

- Current Node Version: node 14

You can install all dependencies and run the app by running `npm run setup` from the root of the project.

```sh
npm run setup
```

- Notes:
  - you may need to `chown` and `chmod` your project folder to be able to execute from inside these files.
    - `sudo chown -R your-username . && sudo chmod -R 700 .`
  - To ensure good practices and a consistent style code, the following packages for the Atom IDE are strongly suggested: `linter`,` linter-eslint`.

## Clean Code
[ESLint](https://github.com/eslint/eslint) and [Prettier](https://github.com/prettier/prettier) automatically lint your staged changes before committing.

At any time, you can apply the `lint` command to format your code to our standards by running:

```sh
npm run lint
```

## Run in development

From the project root:

```sh
npm start
```

- Compiles `client`, available in the browser at `localhost:3000`
- Notes:
  - cave-test-app does NOT currently support a standalone mode. For functionality you should have an instance of [cave_server](https://github.com/MIT-CAVE/cave_app_server) running.
  - The `cave_static` should be accessed through the `cave_server` UI at `localhost:8000`, and not directly at `localhost:3000`.

## Create a static build

1. Edit your `.env` file accordingly
2. Build the app

```sh
npm run build
```

- This will create a static build located at the `BUILD_PATH` found in your `.env`.
- Notes:
  - The build process uses the `PUBLIC_URL` specified in your `.env` file
  - To test the build locally, you should build with the `PUBLIC_URL` matching that of your `localhost`

## Analyze Bundle Size and Dependency Cost

1. Install `source-map-explorer` globally:

- `npm install -g source-map-explorer`

2. Edit your `.env` file accordingly

- Make sure to set `GENERATE_SOURCEMAP=true`

3. Create a static build (see above)
4. Analyze your bundle

- `source .env && source-map-explorer $(find $BUILD_PATH/static/js* -name "main*.js")`

## Deploy your static build

1. Edit your `.env` file accordingly
2. Deploy your static build:

```sh
./deploy.sh
```

3. (First Time Only) [Route a Route 53 Subdomain to the Cloudfront distribution](https://docs.aws.amazon.com/Route53/latest/DeveloperGuide/routing-to-cloudfront-distribution.html)
