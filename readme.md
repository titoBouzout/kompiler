# kompiler

A framework agnostic compiler/transpiler. For personal use and for friends. Forever work
in progress.

## Options

In package.json at the key `kompiler` you may use the following options

```jsonc
// pacakge.json

{
  "kompiler": {
    // enviroment
    "env": {
      "NODE_ENV": "development/production"
    },
    // an array of "node scripts" to run, watch, and automatically restart
    "node": [
      {
        // the dirname of "input" is automatically watched for restarting the node script
        "input": "socket/index.js",
        // for old node versions, to use "esm" (require vs imports)
        "legacyToEs6": false, // defaults to false
        // in case you have a folder or file you want to watch that is outside "input" folder to restart the script. Useful for developing npm packages using "npm link"
        "watch": []
      }
    ],
    // for all builds:
    "map": [
      // for mapping paths served by the static server for all builds
      ["S:/www/aa/client/npm/package/", "S:/www/npm/package/"]
    ],
    // babel config for all builds
    "babel": {
      "presets": ["solid"]
    },
    // similar to node property is for running rollup, as many as you want
    "builds": [
      {
        // input file to process, a "static file server" is fired on this folder
        "input": ["client/index.js"],
        // where to put the output, if the output is a folder is will use multi-entry
        // file will be client/dist/multi-entry.js instead when folder a folder is used here
        "output": "client/dist/index.m.js",
        // if output should be minified and treeshaked
        "minified": false,
        // useful for when testing video that chrome does 206 requests, express is slow the compiler use a faster server but doesnt support 206
        "express": false,
        // server document root, set to `false` to not start a static file server
        "root": "./",
        // for opening a special page when loading the server
        "page": "index.kompiler.html",
        "hostname": "localhost",
        // "iife" || "es" output format, defaults to iife, if multi entry is used defaults to es
        "format": "iife",
        // babel config
        "babel": {
          "presets": ["solid"]
        },
        // in case you have a folder or file you want to watch that is outside "input" folder. Useful for developing npm packages using "npm link". It will trigger a rebuild and possible an update on the browser if anything changes
        "watch": [],
        // for mapping paths served by the static server
        "map": [["S:/www/aa/client/npm/package/", "S:/www/npm/package/"]],
        // rollup options, if any
        "rollup": {}
      }
    ],
    // legacy stuff, if you need a file from the web and you want to automatically update it this will do it. It checks at most 1 time per day and only if the compiler is running
    "autoupdates": [["https://www.example.net/jquery@3", "client/js/jquery.js"]]
  }
}
```

## TODO

- handle merge conflicts
- npm versioning when publishing
- set env production automatically?
