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
    _s = require('underscore.string'),
    mongoose = require('mongoose'),
    debug = require('./debugger.js'),
    join = path.resolve,
    readdir = fs.readdirSync,
    exists = fs.existsSync,
    configStorage = {},
    serviceStorage = {},
    modelStorage = {};

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

var HeMan = module.exports = function () {
    //Get version
    this.version = require('../../package.json').version;
    //Load files
    this.load = function (root, cb) {
        var fullPath = join(__dirname, '..', '..', 'api', root);
        var ENV = process.env.NODE_ENV || 'development';
        //
        if (root === 'config') {
            var configPath = join(fullPath, ENV);
            //Read this directory
            if (exists(configPath)) {
                readdir(configPath).forEach(function (file) {
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
            readdir(fullPath).forEach(function (file) {
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
    this.load('config', function (filePath, fileName) {
        //Require configs
        var config = require(filePath);
        //Set Property
        configStorage[fileName] = config;
    });
    //Debug
    debug('Custom settings loaded', 'success');
    //Load WebServices
    this.load('services', function (filePath, fileName) {
        //Check if exists
        if (exists(filePath)) {
            //Require webservice
            var service = require(filePath);
            serviceStorage[fileName] = service;
        }
    });
    //Debug
    debug('Services loaded', 'success');
    //Load Models
    this.load('models', function (filePath, fileName) {
        //Check if exists
        if (exists(filePath)) {
            //Require Models
            var model = require(filePath);
            modelStorage[_s.capitalize(fileName)] = model;
        }
    });
    //Debug
    debug('Models loaded', 'success');
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
 * Method responsible for get models
 *
 * @example
 *
 *     heMan.getModel('fileName');
 *
 * @method getModel
 * @public
 * @param {String} fileName Name of model file
 */

HeMan.prototype.getModel = function getModel(fileName) {

    if (fileName) {
        return modelStorage[_s.capitalize(fileName)] || null;
    } else {
        return modelStorage;
    }
};

/**
 * Method responsible for get libs
 *
 * @example
 *
 *     heMan.getLib();
 *
 * @method getLib
 * @public
 * @param {String} fileName Name of lib file
 */

HeMan.prototype.getLib = function getLib(fileName) {
    //Load Lib
    return require(join(__dirname, '..', fileName));
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

HeMan.prototype.loadSockets = function (port, cb) {
    //Create App
    var exApp = require('express')();
    //Middlewares
    exApp.use(require('cors')({
        origin: '*',
        credentials: true,
        methods: 'GET, POST, PUT, DELETE, OPTIONS, HEAD',
        headers: 'Origin, x-requested-with, content-type, accept'
    }));
    exApp.use(function (req, res, next) {
        res.removeHeader('X-Powered-By');
        res.setHeader('X-Powered-By', 'HeMan.js');
        return next();
    });
    //Main route
    exApp.get('/', function (req, res) {
        res.jsonp({
            tocaLivros: 'Welcome to Service Bus'
        });
    });
    //Start server
    var http = require('http'),
        Server = http.createServer(exApp).listen(port, function () {
            debug('Server running on port '.green + ' [ ' + String(port).bold + ' ]', 'success');
        }),
        io = require('socket.io')(Server, {
            serveClient: false,
            origins: '*:*'
        });

    //heMan instance
    var heMan = new HeMan();

    if (heMan.getConfig('database').enabled) {
        //If not connected, connect and use this connection
        mongoose.connect(configStorage.database.uri);
        var Db = mongoose.connection;
        //MongoDB ErrorHandler
        if (process.env.NODE_ENV !== 'test') {
            Db.on('error', console.error.bind(console, 'Connection error:'.red));
        }
        //MongoDB ConnnectedEvent
        Db.on('connected', function () {
            debug('MongoDB connected successfully', 'success');
        });
        //MongoDB DisconnnectedEvent
        Db.on('disconnected', function () {
            debug('MongoDB disconnected', 'error');
        });
        //MongoDB autoClose
        process.on('SIGINT', function () {
            mongoose.connection.close(function () {
                debug('Mongoose disconnected through app termination', 'error');
                process.exit(0);
            });
        });
    }

    //Loader extensions
    this.loadSocketExtensions(io, function () {
        debug('Socket Extensions loaded', 'success');
    });

    //Instance
    var loader = this;

    //Sockets
    io.on('connection', function (socket) {

        debug('Client Connected', 'success');

        loader.load('sockets', function (filePath, fileName) {
            //Require configs
            var sockets = require(filePath)(heMan, heMan.getConfig());
            //Load All Sockets
            _.each(sockets.prototype, function (s, key) {
                //Handle requests
                if (s.hasOwnProperty('on') && _.isFunction(s.on)) {
                    socket.on(path.join(fileName, key), s.on);
                }
                if (s.hasOwnProperty('emit')) {
                    socket.emit(path.join(fileName, key), s.emit);
                }
            });
        });

        socket.on('disconnect', function () {
            debug('Connection closed', 'error');
        });

    });

    //Run callback
    cb();
};

/**
 * Method responsible for load socket extensions
 *
 * @example
 *
 *     heMan.loadSocketExtensions(io, function(){});
 *
 * @method loadSocketExtensions
 * @public
 * @param {Object} io Instance of socket.io;
 * @param {Function} cb Callback
 */

HeMan.prototype.loadSocketExtensions = function loadSocketExtensions(io, cb) {
    //Load Extensions
    this.load('../lib/extensions', function (filePath) {
        //Check if exists
        if (exists(filePath)) {
            //Require extension
            var ext = require(filePath);
            //Create extension
            if (ext.hasOwnProperty('core') && ext.core.hasOwnProperty('extends') && typeof ext.core.extends === 'function') {
                ext.core.extends(io);
            }
        }
    });

    //Run callback
    cb();
};
