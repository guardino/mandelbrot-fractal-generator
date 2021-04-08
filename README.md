# Mandelbrot Fractal Generator

MEAN stack app for generating Mandelbrot and Julia Sets

Copyright (c) 2018-2021 Dr. Cesare Guardino

MIT License

## Development server

- Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.
- Run `npm run start:server` to start a dev backend Node.js/Express server. Navigate to `http://localhost:3000/`
- Run `mkdir backend\images` to create the directory to store uploaded images if it does not already exist.

## Build

- Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Deployment

- Run `deploy_patch.sh` to patch server and DB settings in some of the source files before deploying.
- Run `deploy.sh` to actually build a production version and automatically deploy to a Linux server. Navigate to `http://<REMOTE_HOST>:3000/`.
- Run `deploy_monitor.sh` to check if the `node` process is running on the Linux server.

## Running unit tests

- Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io). These are currently not used.

## Running end-to-end tests

- Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/). These are currently not used.

## Further help

For further details please contact Dr. Cesare Guardino on LinkedIn or GitHub<br>
