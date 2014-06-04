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

var HeMan = require('./heMan.js'),
    heMan = new HeMan(),
    debug = require('./debugger.js');

exports.run = function(port) {
    //Load dependencies
    heMan.loader();
    //Start
    heMan.loadSockets(process.env.PORT || port || 8081, function() {
        debug('Sockets loaded successfully!', 'success');
    });
};
