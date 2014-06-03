/*
 * he-man
 * https://github.com/chrisenytc/he-man
 *
 * Copyright (c) 2014 Christopher EnyTC
 * Licensed under the MIT license.
 */

'use strict';

var app = angular.module('heManApp', ['ngRoute']);

app.config([
    '$routeProvider',
    function($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'views/index.html',
            controller: 'indexCtrl'
        }).otherwise({
            redirectTo: '/'
        });
    }
]);
