/*
 * grunt-karma
 * https://github.com/karma-runner/grunt-karma
 *
 * Copyright (c) 2013 Dave Geddes
 * Licensed under the MIT license.
 */

var runner = require('karma').runner;
var server = require('karma').server;
var path = require('path');
var optimist = require('optimist');

var remote = require('../../protractor/node_modules/selenium-webdriver/remote');

module.exports = function (grunt) {
    var _ = grunt.util._;

    grunt.registerMultiTask('karma', 'run karma.', function () {
        var done = this.async();
        var options = this.options({
            background: false
        });
        var config = this.data;
        config.target = this.target;

        var files = undefined;
        if (config.nestedFileMerge === undefined || config.nestedFileMerge != false) {
            // Merge karma config files property from global options and specified target options
            // expanding each file entry:
            // this supports filtered selections [ 'path/**/*.js', '!path/**/*.spec.js' ]
            // caveat: files created after karma server is started will not be included or watched.
            files = mergeFilePatterns(grunt, config, options);
        }

        //merge options onto config, with config taking precedence
        config = _.merge(options, config);

        if(files) {
            config.files = files; // replace with merged file list
        }

        if (config.configFile) {
            config.configFile = path.resolve(config.configFile);
            config.configFile = grunt.template.process(config.configFile);
        }

        //pass cli args on as client args, for example --grep=x
        config.clientArgs = require('optimist').argv;

        if (config.start_selenium === true) {
            startSelenium(config);
        }

        //support `karma run`, useful for grunt watch
        if (this.flags.run) {
            console.log("\nkarma.runner.run(...)");
            runner.run(config, function(code) {
                if (config.kill_selenium === true) { killSelenium(); }
                console.log('\n', config.target,'Tests Complete...');
                done(code);
            });
            return;
        }

        //allow karma to be run in the background so it doesn't block grunt
        if (config.background) {
            console.log("\ngrunt.util.spawn(karma.server.start(...))");
            grunt.util.spawn({cmd: 'node', args: [path.join(__dirname, '..', 'lib', 'background.js'), JSON.stringify(config)]}, function () {
            });
            if (config.kill_selenium === true) { killSelenium(); }
            console.log('\n', config.target,'Tests Complete...');
            done();
        }
        else {
            var asyncComplete = function(code) {
                if (config.kill_selenium === true) { killSelenium(); }
                console.log('\n', config.target,'Tests Complete...');
                return done(code === 0);
            };
            console.log("\nkarma.server.start(...)");
            server.start(config, asyncComplete);
        }
    });
};

function mergeFilePatterns(grunt, globalOptions, targetOptions) {

    var filePatterns = [];
    if (targetOptions.files != undefined && targetOptions.files != undefined) {
        filePatterns = grunt.util._.clone(targetOptions.files);
    }
    // global options are listed first in the files.src array
    if (globalOptions.files != undefined && globalOptions.files != undefined) {
        filePatterns = filePatterns.concat(grunt.util._.clone(globalOptions.files));
    }

    var files = [];
    filePatterns.forEach(function (item) {
        var list = undefined;
        var obj = {};
        // the following properties default to true
        obj.pattern = undefined;
        obj.watched = item.watched === undefined || item.watched ? undefined : false;
        obj.served = item.served === undefined || item.served ? undefined : false;
        obj.included = item.included === undefined || item.included ? undefined : false;

        if (item.pattern) {
            list = grunt.file.expand(item.pattern);
            list.forEach(function (file) {
                obj.pattern = undefined;
                var entry = grunt.util._.clone(obj);
                entry.pattern = file;
                files.push(entry);
            });
        } else if (grunt.util._.isArray(item)) {
            list = grunt.file.expand(item);
            list.forEach(function (file) {
                files.push(file);
            });
        } else {
            files.push(item);
        }
    });

    return files;
}

function configServer(grunt, options, config) {

}

function isServerRunning() {

}

function startSelenium(config) {
    console.log("\n==================\nStart Selenium at: ", config.selenium);
}

function killSelenium() {
    console.log("\n-------------------\nKill Selenium Server");
}

/*
function protractor(config) {

    var server;
    var driver;
    var id;

    var cleanUp = function (runner, log) {
        var passed = runner.results().failedCount == 0;
        if (originalOnComplete) {
            originalOnComplete(runner, log);
        }
        if (sauceAccount) {
            sauceAccount.updateJob(id, {'passed': passed}, function () {
            });
            process.exit(passed ? 0 : 1);
        }

        driver.quit().then(function () {
            if (server) {
                util.puts('Shutting down selenium standalone server');
                server.stop();
            }
        }).then(function () {
                process.exit(passed ? 0 : 1);
            });
    };

    var fs
    if (config.seleniumAddress) {

        util.puts('Using the selenium server at ' + config.seleniumAddress);
        startJasmineTests();
    } else if (config.seleniumServerJar) {
        util.puts('Starting selenium standalone server...');
        if (config.chromeDriver) {
            if (!fs.existsSync(config.chromeDriver)) {
                if (fs.existsSync(config.chromeDriver + '.exe')) {
                    config.chromeDriver += '.exe';
                } else {
                    throw 'Could not find chromedriver at ' + config.chromeDriver;
                }
            }
            config.seleniumArgs.push(
                '-Dwebdriver.chrome.driver=' + config.chromeDriver);
        }
        server = new remote.SeleniumServer({
            jar: config.seleniumServerJar,
            args: config.seleniumArgs,
            port: config.seleniumPort
        });
        server.start().then(function (url) {

            util.puts('Selenium standalone server started at ' + url);
            config.seleniumAddress = server.address();
            startJasmineTests();
        });
    } else {
        throw new Error('You must specify either a seleniumAddress, ' +
            'seleniumServerJar, or saucelabs account.');
    }
}
*/
