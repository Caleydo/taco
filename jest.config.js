// test dependencies that require transformation
const pluginsToTransform = [
  'tdp_comments',
  'tdp_ui',
  'tdp_core',
  'bootstrap-sass', // required to transform for phovea_ui
  'phovea_ui',
  'phovea_clue',
  'phovea_core',
  'phovea_security_flask',
  'sandbox',
  'tdp_marvinjs'
].join('|');

/**
 * TODO check if we can process inline webpack loaders (e.g. as found in https://github.com/phovea/phovea_ui/blob/master/src/_bootstrap.ts)
 * see also https://jestjs.io/docs/en/webpack#mocking-css-modules
 */
module.exports = {
  transform: {
    "^.+\\.tsx?$": "ts-jest"
  },
  testRegex: "(.*(test|spec))\\.(tsx?)$",
  testURL: "http://localhost/",
  moduleFileExtensions: [
    "ts",
    "tsx",
    "js",
    "jsx",
    "json",
    "node"
  ],
  modulePaths: [
    "src",
    "../node_modules",
    "../"
  ],
  transformIgnorePatterns: [`../node_modules/(?!${pluginsToTransform})`],
  globals: {
    "__VERSION__": "TEST_VERSION",
    "__APP_CONTEXT__": "TEST_CONTEXT"
  },
  moduleNameMapper: {
    "^.+\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "imports-loader?.*": "imports-loader",
    "raw-loader?.*": "raw-loader",
    "file-loader?.*": "file-loader",
    "script-loader?.*": "script-loader"
  }
}
