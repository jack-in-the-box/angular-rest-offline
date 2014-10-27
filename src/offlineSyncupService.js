(function(window, angular, undefined) {
    'use strict';
    angular.module("restOffline")
        .factory("OfflineSyncUpService", function($localForage, $http, $q) {
            /**
            Second service pour éviter une dépendance cyclique avec $http
            */
            return {
                syncUp: function() {

                    var OfflineSyncUpService = this;
                    return $localForage.getItem("historyRequest")
                        .then(function(historyRequest) {
                            return historyRequest || [];
                        }).then(function(historyRequest) {
                            if (!historyRequest.length) {
                                return;
                            }
                            var request = historyRequest[0];
                            return $http({
                                method: request.method,
                                url: request.url,
                                data: request.data,
                                headers: {
                                    requestUuid: request.uuid
                                }
                            }).then(function() {
                                return OfflineSyncUpService.syncUp();
                            });
                        });
                }
            };
        });
})(window, window.angular);