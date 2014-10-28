
/*globals describe, beforeEach, afterEach, inject, module, it, expect, angular */

describe('Module: RestOffline', function () {
    'use strict';

    var rootScope,
        $injector,
        myService,
        q,
        spies = {};

     beforeEach(inject(function ($rootScope, $q) {
         rootScope = $rootScope;
         q = $q;
         $injector = angular.injector(['restOffline']);
        // myService = $injector.get('OfflineService');

         //spies.getKeys = spyOn(myService, 'getKeys');
     }));

    afterEach(function () {
         rootScope.$apply();
     });

    it("test", function() {
        expect(true).toBe(true);
    });
});