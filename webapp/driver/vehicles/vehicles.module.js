(function(angular) {
    var module = angular.module('cab9.driver.vehicles', []);

    module.config(configFn);
    module.run(runFn);

    configFn.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function configFn($stateProvider, MenuServiceProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/vehicles', '/vehicles/cards');

        $stateProvider.state('root.vehicles', {
            url: '/vehicles',
            abstract: true,
            default: 'root.vehicles.cards',
            resolve: {
                rData: ['Model', 'Auth', function(Model, Auth) {
                    return Model.Vehicle
                        .query()
                        .filter("DriverId eq guid'" + Auth.getSession().Claims.DriverId[0] + "'")
                        .include('Type')
                        .include('Class')
                        .include('Driver')
                        .include('VehicleTags')
                        .execute();
                }]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                    controller: ['$scope', 'rData', function($scope, rData) {
                        $scope.searchTerm = {};
                    }]
                },
                'options-area@root.vehicles': {
                    templateUrl: '/webapp/driver/vehicles/all/vehicles-module-options.partial.html',
                    controller: 'VehiclesModuleOptionsController'
                }
            }
        });

        $stateProvider.state('root.vehicles.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item.Id;
                        },
                        Title: function(item) {
                            var title = '';
                            title += item.Make + ' ' + item.Model;
                            return title;
                        },
                        SubTitle: function(item) {
                            var subtitle = item.Colour + ' ' + item.Class.Name;
                            return subtitle;
                        },
                        LogoUrl: function(item) {
                            return item._ImageUrl
                        },
                        Group: function(item) {
                            return item.Type.Name
                        }
                    };
                }],
                rNavTo: function() {
                    return 'root.vehicles.viewer.dashboard';
                }

            },
            views: {
                'view-area@root.vehicles': {
                    templateUrl: '/webapp/shared/views/numplate/module-number-plate-secondary.partial.html',
                    controller: 'ModuleNumPlateSecondaryController'
                }
            }
        });

        //table view state
        $stateProvider.state('root.vehicles.table', {
            url: '/table',
            hasHelp: '/webapp/driver/vehicles/all/vehicles-help.modal.html',
            resolve: {
                rNavTo: function() {
                    return 'root.vehicles.viewer.dashboard';
                },
                rSchema: function() {
                    return 'Vehicle';
                },
            },
            views: {
                'view-area@root.vehicles': {
                    templateUrl: '/e9_components/layouts/module/module-table.partial.html',
                    controller: 'ModuleTableController'
                }
            }
        });

        //viewer state
        $stateProvider.state('root.vehicles.viewer', {
            url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
            default: 'root.vehicles.viewer.dashboard',
            viewerType: 'Vehicle',
            resolve: {
                rTabs: ['$stateParams', function($stateParams) {
                    return [{
                        heading: 'Dashboard',
                        route: 'root.vehicles.viewer.dashboard',
                        params: {
                            vehicleId: $stateParams.Id
                        }
                    }, {
                        heading: 'Info',
                        route: 'root.vehicles.viewer.info',
                        params: {
                            vehicleId: $stateParams.Id
                        }
                    }, {
                        heading: 'Documents',
                        route: 'root.vehicles.viewer.documents',
                        params: {
                            vehicleId: $stateParams.Id
                        }
                    }];
                }],
                rData: ['Model', '$stateParams', function(Model, $stateParams) {
                    return Model.Vehicle
                        .query()
                        .where('Id', '==', "guid'" + $stateParams.Id + "'")
                        .include('Type')
                        .include('Class')
                        .include('Driver')
                        .include('Driver/DriverTags')
                        .include('VehicleTags')
                        .execute();
                }],
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item.Id;
                        },
                        Title: function(item) {
                            return item._Description;
                        },
                        SubTitle: function(item) {
                            return item.Type.Name;
                        },
                        LogoUrl: function(item) {
                            return item._ImageUrl;
                        }
                    };
                }]
            },
            views: {
                'content-wrapper@root': {
                    controller: 'ModuleItemViewController',
                    templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                }
            }
        });

        //viewer dashboard state
        $stateProvider.state('root.vehicles.viewer.dashboard', {
            url: '/dashboard',
            viewerType: 'Vehicle',
            templateUrl: '/webapp/driver/vehicles/item/vehicle-item-dashboard.partial.html',
            controller: 'VehicleItemDashboardController'
        });

        //viewer info state
        $stateProvider.state('root.vehicles.viewer.info', {
            url: '/info',
            viewerType: 'Vehicle',
            templateUrl: '/webapp/driver/vehicles/item/vehicle-item-info.partial.html',
            controller: 'VehicleItemInfoController',
            resolve: {
                'rVehicleTypes': ['LookupCache', 'Model', function(LookupCache, Model) {
                    if (LookupCache.VehicleType && LookupCache.VehicleType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                        return LookupCache.VehicleType;
                    } else {
                        return Model.VehicleType
                            .query()
                            .execute()
                            .then(function(data) {
                                LookupCache.VehicleType = data;
                                LookupCache.VehicleType.$updated = new moment();
                                return LookupCache.VehicleType;
                            });
                    }
                }],
                'rVehicleClasses': ['LookupCache', 'Model', function(LookupCache, Model) {
                    if (LookupCache.VehicleClass && LookupCache.VehicleClass.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                        return LookupCache.VehicleClass;
                    } else {
                        return Model.VehicleClass
                            .query()
                            .execute()
                            .then(function(data) {
                                LookupCache.VehicleClass = data;
                                LookupCache.VehicleClass.$updated = new moment();
                                return LookupCache.VehicleClass;
                            });
                    }
                }],
                'rVehicleTags': ['Model', function(Model) {
                    return Model.VehicleTag
                        .query()
                        .execute();
                }],
                rDrivers: ['Model', function(Model) {
                    return Model.Driver
                        .query()
                        .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType/Name')
                        .include('DriverType')
                        .parseAs(function(item) {
                            this.Id = item.Id;
                            this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                            this.Description = item.DriverType.Name;
                            this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                        })
                        .execute();
                }]
            }
        });

        //viewer document state
        $stateProvider.state('root.vehicles.viewer.documents', {
            url: '/documents',
            viewerType: 'Vehicle',
            controller: 'ModuleDocumentsController',
            templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
            resolve: {
                rDocuments: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                    return Model.Document
                        .query()
                        .where("OwnerType eq 'Vehicle'")
                        .where("OwnerId eq guid'" + $stateParams.Id + "'")
                        .include("DocumentType")
                        .execute();
                }],
                rConfig: ['$stateParams', function($stateParams) {
                    return {
                        type: "Vehicle",
                        id: $stateParams.Id
                    };
                }]
            }
        });


        MenuServiceProvider.registerMenuItem({
            state: 'root.vehicles.cards',
            icon: 'icon-drive-eta',
            title: 'Vehicles'
        });

    }

    runFn.$inject = [];

    function runFn() {

    }

    function formatUrl(ImageUrl, text) {
        if (ImageUrl) {
            if (ImageUrl.slice(0, 4) == 'http') {
                return ImageUrl;
            } else {
                return $config.API_ENDPOINT + ImageUrl;
            }
        } else {
            return $config.API_ENDPOINT + 'api/imagegen?text=' + text;
        }
    }
}(angular));
