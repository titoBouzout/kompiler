# kompiler

A framework agnostic compiler/transpiler currently used mostly for solidjs projects. For personal use and for friends. Forever work in progress.

## Usage

TODO provide a forkeable repo to use this

## Options

In package json at the key `kompiler` you may use the following options

```json
{
  "kompiler": {
    // an array of "node scripts" to run, watch and automatically restart
    "node": [
      {
        "input": "socket/index.js", // the dirname of "input" is automatically watched for restarting the node script
        "legacyToEs6": true, // for old node versions, to use "esm" (require vs imports)
        "watch": [] // in case you have a folder or file you want to watch that is outside "input" folder to restart the script. Useful for developing npm packages using "npm link"
      }
    ],

    // similar to node property is for running rollup, as many as you want
    "builds": [
      {
        "input": ["client/index.js"], // input file to process, a "static file server" is fired on this folder
        "output": "client/dist/index.m.js", // where to put the output
        "minified": false, // if output should be minified and treeshaked
        "express": false, // useful for when testing video that chrome does 206 requests, express is slow the compiler use a faster server but doesnt support 206
        "babel": {
          // babel config
          "presets": ["solid"]
        },
        "watch": [], // in case you have a folder or file you want to watch that is outside "input" folder. Useful for developing npm packages using "npm link". It will trigger a rebuild and possible an update on the browser if anything changes
        "map": [
          // for mapping paths served by the static server
          ["S:/www/aa/client/npm/package/", "S:/www/npm/package/"]
        ]
      }
    ],
    // legacy stuff, if you need a file from the web and you want to automatically update it this will do it. It checks at most 1 time per day and only if the compiler is running
    "autoupdates": [["https://www.example.net/jquery@3", "client/js/jquery.js"]]
  }
}
```

## TODO

some day

- when an exec command fails it displays ugly messages
- maybe make it compile on the server xD I dont like it because makes publishing sites slow as it has to run all the npm stuff
- every configuration option should be optional, currently its possible it will error out I if something is missing
- handle merge conflicts
- npm versioning when publishing
- treeshake is not dynamic
- node-replace is not dynamic
