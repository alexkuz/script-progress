# script-progress

Simple tool for heavy NPM/Yarn scripts that run for long but roughly identical time. It's not intended to be exact but gives you a sense of estimated time.

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

The script will show a progress bar on a second and subsequent runs.
