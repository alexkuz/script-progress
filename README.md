# script-progress

A simple tool for heavy NPM/Yarn scripts that run for a long but roughly identical time. It's not intended to be precise but gives you some sense of execution time.

### Installation

```sh
yarn add script-progress
```
or
```sh
npm i script-progress
```

### Example Usage

Change your build script in `package.json`:
```diff
- "build": "react-scripts build",
+ "build-js": "react-scripts build",
+ "build": "script-progress yarn build-js",
```
or just
```diff
- "build": "react-scripts build",
+ "build": "script-progress react-scripts build",
```

The script will show a progress bar on the second and subsequent runs.
