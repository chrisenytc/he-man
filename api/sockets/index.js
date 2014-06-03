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

var util = require('util');

module.exports = function(app, config) {
    //Root Application
    var ApplicationController = app.getBase();

    function IndexController() {
        ApplicationController.call(this);
    }

    util.inherits(IndexController, ApplicationController);

    IndexController.prototype.index = {
        on: function() {
            //Create socket instance
            var socket = this;
            //Callback handler
            function callback(err, result, msg) {
                if (err) {
                    return socket.emit('index/list', {
                        error: err
                    });
                }
                if (!result) {
                    return socket.emit('index/list', {
                        error: msg
                    });
                }
                return socket.emit('index/list', result);
            }
            //invoke
            return callback(null, {config: config, service: app.getService('utilsService')});
        }
    };

    return IndexController;
};
