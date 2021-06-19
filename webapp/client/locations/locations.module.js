(function (angular) {
    var module = angular.module('cab9.client.locations', []);

    module.config(moduleConfig);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        $stateProvider.state('root.locations', {
            url: '/locations',
            viewerType: 'Client',
            permission: 'Client Locations',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/client/locations/partial.html',
                    controller: 'ClientLocationsController'
                }
            },
            resolve: {
                'rLocations': ['Model', '$rootScope', function (Model, $rootScope) {
                    console.log($rootScope.CLIENTID);
                    return Model.Client.query().select('Id,Latitude,Longitude,KnownLocations').include('KnownLocations').filter("Id eq guid'" + $rootScope.CLIENTID + "'").execute();
                        }]
            }
        });
        $stateProvider.state('root.locations.create', {
            url: '/locations',
            viewerType: 'Client',
            permission: 'Client Locations',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/common/views/locations/create.partial.html',
                    controller: 'ClientLocationCreateController'
                }
            },
            resolve: {
                'rLocations': ['Model', '$rootScope', function (Model, $rootScope) {
                    console.log($rootScope.CLIENTID);
                    return Model.Client.query().select('Id,Latitude,Longitude,KnownLocations').include('KnownLocations').filter("Id eq guid'" + $rootScope.CLIENTID + "'").execute();
                        }]
            }
        });
        MenuServiceProvider.registerMenuItem({
            state: 'root.locations',
            icon: 'location_on',
            title: 'Locations'
        });
    }
}(angular))