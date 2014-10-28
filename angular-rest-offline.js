(function(window, angular, undefined) {
    'use strict';
    angular.module("restOffline", [
        "uuid",
        "LocalForageModule"
    ]);
})(window, window.angular);
(function(window, angular, undefined) {
    'use strict';
    angular.module("restOffline")
        .provider("OfflineService", function() {
            var config = {
                apiUrl: "/api/",
                apis: {}
            };

            this.setApis = function(apis) {
                apis.forEach(function(api) {
                    config.apis[api.ressource] = {
                        finder: api.finder || function(collection, id) {
                            var res = false;
                            collection.some(function(e) {
                                if (e.id === id) {
                                    res = e;
                                    return true;
                                }
                                return false;
                            });
                            return res;
                        }
                    };
                });
            };

            this.setApiUrl = function(url) {
                config.apiUrl = url;
            };
            this.$get = function($localForage, $q, rfc4122, $rootScope) {
                var responsePromises = {};


                /**
                    décoder l'url pour récupérer la variable ressourceKey pour sauvegarder en localStorage
                    et uuid qui est le deuxième
                    Format api accepté
                    {{config.apiUrl}}/ressourcekey
                    {{config.apiUrl}}/ressourcekey/id
                */
                var getParamsForApiUrl = function(url) {
                    if (url.indexOf(config.apiUrl) !== 0) {
                        return false;
                    }

                    //ref astuce : https://gist.github.com/jlong/2428561
                    var parser = document.createElement("a");
                    parser.href = url;
                    var paramUrl = parser.pathname.slice(config.apiUrl.length).split('/');

                    if (!config.apis[paramUrl[0]] || paramUrl.length > 2) {
                        //On ne gère pas le cas des sous requetes pour le moment
                        return false;
                    }

                    return {
                        "ressourceKey": paramUrl[0],
                        "id": paramUrl[1] || false
                    };
                };

                var addHistoryRequest = function(requestConfig) {
                    if (!requestConfig.headers.requestUuid) {
                        //on rajoute un requestUuid pour repérer quel requete il faudra supprimer du historyRequest
                        requestConfig.headers.requestUuid = rfc4122.v4();
                    }
                    return $localForage.getItem("historyRequest")
                        .then(function(historyRequest) {
                            return historyRequest || [];
                        })
                        .then(function(historyRequest) {
                            //On n'ajoute pas 2 fois la même requête, dans le cas où on les rejoue

                            if (!historyRequest.some(function(e) {
                                return e.uuid === requestConfig.headers.requestUuid;
                            })) {
                                historyRequest.push({
                                    "uuid": requestConfig.headers.requestUuid,
                                    "url": requestConfig.url,
                                    "method": requestConfig.method,
                                    "data": requestConfig.data
                                });
                                return $localForage.setItem("historyRequest", historyRequest)
                                    .then(function() {
                                        //on prévient le reste du monde qu'il y a un besoin de synchro à faire
                                        // MAIS cela ne veut pas dire que l'on est déconnecté
                                        $rootScope.$broadcast("OfflineService:needSync", true);
                                        return requestConfig;
                                    });
                            }
                            return requestConfig;
                        });
                };

                var getHistoryRequest = function(requestUuid) {
                    if (!requestUuid) {
                        return;
                    }
                    return $localForage.getItem("historyRequest")
                        .then(function(historyRequest) {
                            return historyRequest || [];
                        })
                        .then(function(historyRequest) {
                            return historyRequest.filter(function(e) {
                                return e.uuid === requestUuid;
                            });

                        });
                };

                var removeHistoryRequest = function(requestUuid) {
                    if (!requestUuid) {
                        return;
                    }
                    return $localForage.getItem("historyRequest")
                        .then(function(historyRequest) {
                            return historyRequest || [];
                        })
                        .then(function(historyRequest) {
                            var oldLength = historyRequest.length;
                            historyRequest = historyRequest.filter(function(e) {
                                return e.uuid !== requestUuid;
                            });

                            if (oldLength === historyRequest.length) {
                                return historyRequest;
                            }

                            return $localForage.setItem("historyRequest", historyRequest)
                                .then(function() {
                                    if (!historyRequest.length) {
                                        //historique à vide, cela signifie que l'on a plus rien à synchroniser
                                        $rootScope.$broadcast("OfflineService:needSync", false);
                                    }
                                    return historyRequest;
                                });
                        });
                };

                var getDataFromLocalStorage = function(paramsUrl) {
                    if (paramsUrl.id) {
                        return $localForage.getItem(paramsUrl.ressourceKey)
                            .then(function(ressourceValue) {
                                var obj = config.apis[paramsUrl.ressourceKey].finder(ressourceValue, paramsUrl.id);
                                if (obj) {
                                    return obj;
                                } else {
                                    //La ressource n'a pas été trouvé car elle n'a pas été chargé précedémment quand on était online
                                    return $q.reject();
                                }
                            });
                    }

                    return $localForage.getItem(paramsUrl.ressourceKey);
                };

                var saveDataToLocalStorage = function(paramsUrl, data) {
                    if (paramsUrl.id) { //url du type /api/ressourcekey/uuid
                        return $localForage.getItem(paramsUrl.ressourceKey)
                            .then(function(ressourceValue) {
                                ressourceValue = ressourceValue || [];
                                var obj = config.apis[paramsUrl.ressourceKey].finder(ressourceValue, paramsUrl.id);
                                if (obj) {
                                    for (var i in data) {
                                        obj[i] = data[i];
                                    }
                                } else {
                                    ressourceValue.push(obj);
                                }
                                return $localForage.setItem(paramsUrl.ressourceKey, ressourceValue);
                            });
                    }

                    return $localForage.setItem(paramsUrl.ressourceKey, data);
                };

                this.getDataFromRecentPromises = function(response) {
                    var requestUuid = response.config.headers.requestUuid;
                    if (responsePromises[requestUuid]) {
                        response.data = responsePromises[requestUuid]
                            .then(function(data) {
                                return data;
                            });

                        return response;
                    }
                    return response;
                };

                return {
                    response: function(response) {
                        var paramsForApiUrl = getParamsForApiUrl(response.config.url);
                        if (!paramsForApiUrl) {
                            return response;
                        }

                        //Traitement d'une URL de type API

                        if (response.config.method === 'GET') {
                            saveDataToLocalStorage(paramsForApiUrl, response.data);
                        } else {
                            //POST PUT et DELETE
                            removeHistoryRequest(response.config.headers.requestUuid);
                        }

                        return response;
                    },
                    responseError: function(response) {
                        // si statut == 0 cela signifie que l'on est sur un manifest fallback
                        if (getParamsForApiUrl(config.url) && !response.status) {

                            //dans le cas normal, hors syncUp,
                            if (response.config.method === 'GET') {
                                response.data = getDataFromLocalStorage(paramsForApiUrl);
                            } else {
                                response.data = getDataFromRecentPromises(response);
                            }
                        }
                        return $q.reject(response);
                    },
                    request: function(config) {
                        var paramsForApiUrl = getParamsForApiUrl(config.url);
                        if (!paramsForApiUrl || config.method === 'GET' || config.headers.requestUuid) {
                            //sort si on est dans le cas d'une methode GET ou la requete a déjà été enregistré (donc il existe déjà un requestUuid)
                            return config;
                        }

                        return addHistoryRequest(config)
                            .then(function(config) {
                                switch (config.method) {
                                    case 'POST':
                                        responsePromises[config.headers.requestUuid] = $localForage.getItem(paramsForApiUrl.ressourceKey)
                                            .then(function(ressourceValue) {
                                                ressourceValue.push(config.data);

                                                $localForage.setItem(paramsForApiUrl.ressourceKey, ressourceValue);
                                                return config.data;
                                            });
                                        break;
                                    case 'PUT':
                                        //TODO 
                                        break;
                                    case 'DELETE':
                                        //TODO 
                                        break;
                                }
                                return config;
                            });
                    }
                };
            };
        });
})(window, window.angular);

(function(window, angular, undefined) {
    'use strict';
    angular.module("restOffline")
        .factory("OfflineSyncUpService", function($localForage, $http) {
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
