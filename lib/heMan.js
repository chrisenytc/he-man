/*
 * he-man
 * https://github.com/chrisenytc/he-man
 *
 * Copyright (c) 2014 Christopher EnyTC
 * Licensed under the MIT license.
 */

'use strict';

/*
 * Module Dependencies
 */

var fs = require('fs'),
    path = require('path'),
    _ = require('underscore'),
    debug = require('./debugger.js'),
    join = path.resolve,
    readdir = fs.readdirSync,
    exists = fs.existsSync,
    configStorage = {},
    serviceStorage = {};

/*
 * Public Methods
 */

/**
 * @class HeMan
 *
 * @constructor
 *
 * Constructor responsible for provide a application server and helpers
 *
 * @example
 *
 *     var heMan = new HeMan();
 *
 */

var HeMan = module.exports = function() {
    //Get version
    this.version = require('../package.json').version;
    //Load files
    this.load = function(root, cb) {
        var fullPath = join(__dirname, '..', 'api', root);
        var ENV = process.env.NODE_ENV || 'development';
        //
        if (root === 'config') {
            var configPath = join(fullPath, ENV);
            //Read this directory
            if (exists(configPath)) {
                readdir(configPath).forEach(function(file) {
                    if (fs.statSync(join(configPath, file)).isFile()) {
                        //Resolve file path
                        var filePath = join(configPath, file);
                        //Check if this file exists
                        if (exists(filePath)) {
                            //Run callback
                            var fileName = file.replace(/\.js$/, '');
                            fileName = fileName.replace(/\.json$/, '');
                            cb(filePath, fileName);
                        }
                    }
                });
            } else {
                console.log('ERROR: The '.red + ENV.white + ' environment not exists in api/config'.red);
                process.exit(0);
            }
        } else {
            //Read this directory
            readdir(fullPath).forEach(function(file) {
                if (fs.statSync(join(fullPath, file)).isFile()) {
                    //Resolve file path
                    var filePath = join(fullPath, file);
                    //Check if this file exists
                    if (exists(filePath)) {
                        //Run callback
                        var fileName = file.replace(/\.js$/, '');
                        fileName = fileName.replace(/\.json$/, '');
                        cb(filePath, fileName);
                    }
                }
            });
        }
    };
};

/**
 * Method responsible for load all dependencies
 *
 * @example
 *
 *     heMan.loader();
 *
 * @method loader
 * @public
 */

HeMan.prototype.loader = function loader() {
    //Load Settings
    this.load('config', function(filePath, fileName) {
        //Require configs
        var config = require(filePath);
        //Set Property
        configStorage[fileName] = config;
    });
    //Debug
    debug('Custom settings loaded!', 'success');
    //Load Services
    this.load('services', function(filePath, fileName) {
        //Check if exists
        if (exists(filePath)) {
            //Require webservice
            var service = require(filePath);
            serviceStorage[fileName] = service;
        }
    });
    //Debug
    debug('Services loaded!', 'success');
};

/**
 * Method responsible for get configs
 *
 * @example
 *
 *     heMan.getConfig('fileName');
 *
 * @method getConfig
 * @public
 * @param {Object} fileName Name of config file
 */

HeMan.prototype.getConfig = function getConfig(fileName) {

    if (fileName) {
        return configStorage[fileName] || null;
    } else {
        return configStorage;
    }
};

/**
 * Method responsible for get services
 *
 * @example
 *
 *     heMan.getService('fileName');
 *
 * @method getService
 * @public
 * @param {Object} fileName Name of service file
 */

HeMan.prototype.getService = function getService(fileName) {

    if (_.isFunction(serviceStorage[fileName])) {
        return serviceStorage[fileName].call(this) || null;
    }

    return serviceStorage[fileName] || null;
};

/**
 * Method responsible for get base
 *
 * @example
 *
 *     heMan.getBase();
 *
 * @method getBase
 * @public
 */

HeMan.prototype.getBase = function getBase() {
    //Load Base Application

    return require('./baseApplication.js');
};

/**
 * Method responsible for loadding sockets
 *
 * @example
 *
 *     heMan.loadSockets(8081, function() {});
 *
 * @method loadSockets
 * @public
 * @param {Object} port Port of socket
 * @param {Function} cb Callback
 */

HeMan.prototype.loadSockets = function(port, cb) {
    var Server = require('http').createServer();
    var io = require('socket.io')(Server);

    //heMan instance
    var heMan = new HeMan(),
        redis;

    if (heMan.getConfig('database').enabled) {
        //Start redis instance
        redis = require('redis').createClient();
        redis.on('connect', function() {
            debug('Redis => Connected successfully!', 'success');
        });
        redis.on('error', function(err) {
            debug('Redis => Error ' + err, 'error');
        });
    }

    //Instance
    var loader = this;

    //Start server
    io.serveClient(false);
    Server.listen(port, function() {
        debug('Socket.io => Server listening at port ' + port, 'success');
    });

    //Sockets
    io.on('connection', function(socket) {

        debug('Socket.io => Connected!', 'success');

        loader.load('sockets', function(filePath, fileName) {
            //Require configs
            var sockets = require(filePath)(heMan, redis, heMan.getConfig());
            //Load All Sockets
            _.each(sockets.prototype, function(s, key) {
                //Handle requests
                if (s.hasOwnProperty('on') && _.isFunction(s.on)) {
                    socket.on(path.join(fileName, key), s.on);
                }
                if (s.hasOwnProperty('emit')) {
                    socket.emit(path.join(fileName, key), s.emit);
                }
            });
        });

        socket.on('disconnect', function() {
            debug('Socket.io => Connection closed!', 'error');
        });

    });

    //Run callback
    cb();
};
