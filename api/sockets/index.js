'use strict';

/*
 * Module Dependencies
 */

var util = require('util');

module.exports = function(app, db, config) {
    //Root Application
    var ApplicationController = app.getLib('baseApplication');

    function IndexController() {
        ApplicationController.call(this);
    }

    util.inherits(IndexController, ApplicationController);

    IndexController.prototype.index = {
        on: function(data) {
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
            //Save
            db.set('heman', data);
            //Get
            db.get('heman', function(err, reply) {
                if(err) {
                    return callback(err);
                }
                //invoke
                return callback(null, {
                    db: reply,
                    config: config,
                    service: app.getService('utilsService')
                });
            });
        }
    };

    return IndexController;
};
