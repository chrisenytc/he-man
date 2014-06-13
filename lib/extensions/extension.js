'use strict';

module.exports = {
    core: {
        extends: function(io) {
            //Socket Middleware
            io.use(function(req, next) {
                return next();
            });
        }
    }
};
