(function (angular) {
    var module = angular.module('cab9.vehicles', []);

    module.config(configFn);
    module.run(runFn);

    configFn.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function configFn($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('vehicles')) return;

        //$urlRouterProvider.when('/vehicles', '/vehicles/cards');

        $stateProvider.state('root.vehicles', {
            url: '/vehicles',
            abstract: true,
            permission: 'Vehicles',
            resolve: {
                rId: function() {
                    return 'Id';
                },
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("substringof('" + searchterms.$ + "', Model) or (substringof('" + searchterms.$ + "', Make) or substringof('" + searchterms.$ + "', Colour) or (substringof('" + searchterms.$ + "', Registration) or substringof('" + searchterms.$ + "', Driver/Firstname) or substringof('" + searchterms.$ + "', Driver/Surname) or substringof('" + searchterms.$ + "', Driver/Callsign) or substringof('" + searchterms.$ + "', VehicleType/Name))")
                        }
                        return query.clone();
                    }
                }
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                    controller: ['$scope', function ($scope) {
                        $scope.searchTerm = {};
                        $scope.serverSearchTerm = {};
                    }]
                },
                'options-area@root.vehicles': {
                    templateUrl: '/webapp/management/vehicles/all/vehicles-module-options.partial.html',
                    controller: 'VehiclesModuleOptionsController'
                },
                'stats-area@root.vehicles': {
                    templateUrl: '/webapp/management/vehicles/all/vehicles-module-stats.partial.html',
                    controller: 'VehiclesModuleStatsController',
                    resolve: {
                        rData: ['Model', function (Model) {
                            return Model.Vehicle
                                .query()
                                .include('Type')
                                .include('Driver')
                                .include('Tags')
                                .select('Id,Colour,Make,Model,Registration,Driver/Surname,Driver/Firstname,Driver/Callsign,Type/Id,Type/Name,ScoreOverall,Active,CreationTime,ImageUrl')
                                .execute();
                        }]
                    }
                }
            }
        });

        $stateProvider.state('root.vehicles.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config', function ($config) {
                    return {
                        Id: function (item) {
                            return item.Id;
                        },
                        Title: function (item) {
                            var title = '';
                            if (item) {
                                title += item.Colour + ' ' + item.Make + ' ' + item.Model;
                            }
                            return title;
                        },
                        SubTitle: function (item) {
                            if (item && item.Driver) {
                                var subtitle = '(' + item.Driver.Callsign + ') ' + item.Driver.Firstname + ' ' + item.Driver.Surname
                            } else {
                                var subtitle = "Company Car"
                            }
                            return subtitle;
                        },
                        LogoUrl: function (item) {
                            return item._ImageUrl
                        },
                        Group: function (item) {
                            return item.Type.Name
                        },
                        Score: function (item) {
                            return item.ScoreOverall;
                        }
                    };
                }],
                rData: ['Model', function (Model) {
                    return Model.Vehicle
                        .query()
                        .include('Type')
                        .include('Class')
                        .include('Driver')
                        .include('Tags')
                        .select('Id,Colour,Make,Model,Registration,Driver/Surname,Driver/Firstname,Driver/Callsign,Type/Id,Type/Name,ScoreOverall,ImageUrl,Active')
                        .parseAs(Model.Vehicle)
                        .execute();
                }],
                rNavTo: function () {
                    return 'root.vehicles.viewer.dashboard';
                }
            },
            views: {
                'view-area@root.vehicles': {
                    templateUrl: '/webapp/common/views/numplate/module-number-plate.partial.html',
                    controller: 'ModuleNumPlateController'
                }
            }
        });

        $stateProvider.state('root.vehicle-types', {
            url: '/vehicle-types',
            resolve: {
                rData: ['Model', '$stateParams', 'LookupCache', function (Model, $stateParams, LookupCache) {
                    return Model.VehicleType
                        .query()
                        .trackingEnabled()
                        .orderBy('Priority')
                        .execute()
                        .then(function (data) {
                            LookupCache.VehicleType = data;
                            LookupCache.VehicleType.$updated = new moment();
                            return LookupCache.VehicleType;
                        });
                }]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/vehicles/item/vehicle-type/partial.html',
                    controller: 'vehicleTypesController'
                }
            }
        });

        $stateProvider.state('root.vehicles.table', {
            url: '/table',
            hasHelp: '/webapp/management/vehicles/all/vehicles-help.modal.html',
            resolve: {
                rNavTo: function () {
                    return 'root.vehicles.viewer.dashboard';
                },
                rSchema: function () {
                    return 'Vehicle';
                },
                rVehicleTypes: ['Model', function(Model) {
                    return Model.VehicleType
                        .query()
                        .execute();
                }],
                rData: ['Model', function (Model) {
                    return Model.Vehicle
                        .query()
                        .include('Type')
                        .include('Class')
                        .include('Driver')
                        .include('Tags')
                        .select('Id,Colour,Make,Model,Registration,Driver/Surname,Driver/Firstname,Driver/Callsign,Type/Id,Type/Name,ScoreOverall,Active,CreationTime,ImageUrl')
                        .top(100)
                        .execute();
                }],
                rQuery: ['Model', function(Model) {
                    return Model.Vehicle
                        .query()
                        .include('Type')
                        .include('Class')
                        .include('Driver')
                        .include('Tags')
                        .select('Id,Colour,Make,Model,Registration,Driver/Surname,Driver/Firstname,Driver/Callsign,Type/Id,Type/Name,ScoreOverall,Active,CreationTime,ImageUrl')
                        .parseAs(Model.Vehicle);
                }],
            },
            views: {
                'options-area@root.vehicles': {
                    templateUrl: '/webapp/management/vehicles/all/vehicles-module-table-options.partial.html',
                    controller: 'VehiclesModuleOptionsController'
                },
                'view-area@root.vehicles': {
                    templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                    controller: 'VehiclePagedTableController'
                }
            }
        });

        if ($permissions.test('vehicles.viewer')) {
            $stateProvider.state('root.vehicles.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.vehicles.viewer.dashboard',
                viewerType: 'Vehicle',
                permission: 'View Vehicle',
                resolve: {
                    rTabs: ['$stateParams', function ($stateParams) {
                        var tabs = [{
                            heading: 'Dashboard',
                            route: 'root.vehicles.viewer.dashboard',
                            params: {
                                vehicleId: $stateParams.Id
                            }
                        }];

                        tabs.push({
                            heading: 'Info',
                            route: 'root.vehicles.viewer.info',
                            params: {
                                vehicleId: $stateParams.Id
                            }
                        })

                        if ($permissions.test('vehicles.viewer.documents')) {
                            tabs.push({
                                heading: 'Documents',
                                route: 'root.vehicles.viewer.documents',
                                params: {
                                    vehicleId: $stateParams.Id
                                }
                            })
                        }

                        if ($permissions.test('vehicles.viewer.notes')) {
                            tabs.push({
                                heading: 'Notes',
                                route: 'root.vehicles.viewer.notes',
                                params: {
                                    vehicleId: $stateParams.Id
                                }
                            })
                        }

                        if ($permissions.test('vehicles.viewer.history')) {
                            tabs.push({
                                heading: 'History',
                                route: 'root.vehicles.viewer.history',
                                params: {
                                    vehicleId: $stateParams.Id
                                }
                            });
                        }

                        return tabs;
                    }],
                    rData: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.Vehicle
                            .query()
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .include('Type,Class,Driver,Driver/Tags,Tags')
                            .trackingEnabled()
                            .execute();
                    }],
                    rAccessors: ['$config', function ($config) {
                        return {
                            Id: function (item) {
                                return item.Id;
                            },
                            Title: function (item) {
                                return item._Description;
                            },
                            SubTitle: function (item) {
                                return item.Type.Name;
                            },
                            LogoUrl: function (item) {
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
                templateUrl: '/webapp/management/vehicles/item/vehicle-item-dashboard.partial.html',
                controller: 'VehicleItemDashboardController'
            });

            $stateProvider.state('root.vehicles.viewer.history', {
                url: '/history',
                viewerType: 'Vehicle',
                permission: 'Vehicle - History',
                templateUrl: '/webapp/management/vehicles/item/vehicle-item-history.partial.html',
                resolve: {
                    rHistory: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.AuditRecord
                                .query()
                                .include('Properties')
                                .include('User')
                                .trackingEnabled()
                                .where('EntityId', 'eq', "guid'" + $stateParams.Id + "'")
                                .where('EntityType', 'eq', "'Vehicle'")
                                .orderBy('Timestamp desc')
                                .execute();
                        }
                    ],
                },
                controller: ['$scope', 'rHistory', function ($scope, rHistory) {
                    $scope.iconsIndex = {
                        "Modified": "assignment"
                    }

                    $scope.coloursIndex = {
                        "Modified": "orange-bg"
                    }

                    $scope.noHistory = false;
                    $scope.history = {};

                    if (rHistory.length == 0) {
                        $scope.noHistory = true;
                    }
                    angular.forEach(rHistory, function (x) {
                        var date = moment(x.Timestamp).format('DD MMM YYYY');
                        if (!$scope.history[date]) {
                            $scope.history[date] = [];
                        }
                        $scope.history[date].push(x);
                    });
                }]
            });

            $stateProvider.state('root.vehicles.viewer.info', {
                url: '/info',
                viewerType: 'Vehicle',
                templateUrl: '/webapp/management/vehicles/item/vehicle-item-info.partial.html',
                controller: 'VehicleItemInfoController',
                resolve: {
                    'rVehicleTypes': ['LookupCache', 'Model', function (LookupCache, Model) {
                        if (LookupCache.VehicleType && LookupCache.VehicleType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                            return LookupCache.VehicleType;
                        } else {
                            return Model.VehicleType
                                .query()
                                .execute()
                                .then(function (data) {
                                    LookupCache.VehicleType = data;
                                    LookupCache.VehicleType.$updated = new moment();
                                    return LookupCache.VehicleType;
                                });
                        }
                    }],
                    'rVehicleClasses': ['LookupCache', 'Model', function (LookupCache, Model) {
                        if (LookupCache.VehicleClass && LookupCache.VehicleClass.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                            return LookupCache.VehicleClass;
                        } else {
                            return Model.VehicleClass
                                .query()
                                .execute()
                                .then(function (data) {
                                    LookupCache.VehicleClass = data;
                                    LookupCache.VehicleClass.$updated = new moment();
                                    return LookupCache.VehicleClass;
                                });
                        }
                    }],
                    'rVehicleTags': ['Model', function (Model) {
                        return Model.Tag
                            .query()
                            .execute().then(function(data) {
                                return data.filter(function(item) {
                                    return item.EntityType.indexOf("Vehicle") != -1;
                                });
                            });
                    }],
                    rDrivers: ['Model', function (Model) {
                        return Model.Driver
                            .query()
                            .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType/Name')
                            .include('DriverType')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                this.Description = item.DriverType.Name;
                                this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                            })
                            .execute();
                    }]
                }
            });

            if ($permissions.test('vehicles.viewer.notes')) {
                $stateProvider.state('root.vehicles.viewer.notes', {
                    url: '/notes',
                    viewerType: 'Notes',
                    permission: 'Vehicle - Notes',
                    controller: 'VehicleItemNotesController',
                    templateUrl: '/webapp/management/vehicles/item/vehicle-item-notes.partial.html',
                    resolve: {
                        rNotes: ['$stateParams', 'Model', '$q', function ($stateParams, Model, $q) {
                            return Model.Note
                                .query()
                                .where("OwnerType eq 'VEHICLE'")
                                .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                .execute();
                        }],
                        rStaffs: ['Model', function (Model) {
                            return Model.Staff
                                .query()
                                .select('Id, Firstname, Surname')
                                .parseAs(function (item) {
                                    this.Name = item.Firstname + ' ' + item.Surname;
                                    this.Id = item.Id
                                })
                                .execute();
                        }],
                        rUsers: ['Model', function (Model) {
                            return Model.User
                                .query()
                                .include('Claims')
                                .execute();
                        }]
                    }
                });
            }

            if ($permissions.test('vehicles.viewer.documents')) {
                $stateProvider.state('root.vehicles.viewer.documents', {
                    url: '/documents',
                    viewerType: 'Vehicle',
                    controller: 'ModuleDocumentsController',
                    templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
                    permission: 'Vehicle - Documents',
                    resolve: {
                        rDocuments: ['$stateParams', 'Model', '$q', function ($stateParams, Model, $q) {
                            return Model.Document
                                .query()
                                .where("OwnerType eq 'Vehicle'")
                                .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                .include("DocumentType")
                                .trackingEnabled()
                                .execute();
                        }],
                        rConfig: ['$stateParams', function ($stateParams) {
                            return {
                                type: "Vehicle",
                                id: $stateParams.Id
                            };
                        }]
                    }
                });
            }
        }

        if ($permissions.test('vehicles', 'W')) {
            $stateProvider.state('root.vehicles.create', {
                url: '/create/?DriverId',
                views: {
                    'content-wrapper@root': {
                        controller: 'VehicleItemCreateController',
                        templateUrl: '/webapp/management/vehicles/item/vehicle-item-info.partial.html',
                        resolve: {
                            'rVehicleTypes': ['LookupCache', 'Model', function (LookupCache, Model) {
                                if (LookupCache.VehicleType && LookupCache.VehicleType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                                    return LookupCache.VehicleType;
                                } else {
                                    return Model.VehicleType
                                        .query()
                                        .execute()
                                        .then(function (data) {
                                            LookupCache.VehicleType = data;
                                            LookupCache.VehicleType.$updated = new moment();
                                            return LookupCache.VehicleType;
                                        });
                                }
                            }],
                            'rVehicleClasses': ['LookupCache', 'Model', function (LookupCache, Model) {
                                if (LookupCache.VehicleClass && LookupCache.VehicleClass.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                                    return LookupCache.VehicleClass;
                                } else {
                                    return Model.VehicleClass
                                        .query()
                                        .execute()
                                        .then(function (data) {
                                            LookupCache.VehicleClass = data;
                                            LookupCache.VehicleClass.$updated = new moment();
                                            return LookupCache.VehicleClass;
                                        });
                                }
                            }],
                            'rVehicleTags': ['Model', function (Model) {
                                return Model.Tag
                                    .query()
                                    .execute().then(function(data) {
                                        return data.filter(function(item) {
                                            return item.EntityType.indexOf("Vehicle") != -1;
                                        });
                                    });
                            }],
                            rDrivers: ['Model', function (Model) {
                                return Model.Driver
                                    .query()
                                    .select('Id,Firstname,Surname,Callsign,ImageUrl,DriverType/Name')
                                    .include('DriverType')
                                    .parseAs(function (item) {
                                        this.Id = item.Id;
                                        this.Name = item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')';
                                        this.Description = item.DriverType.Name;
                                        this.ImageUrl = window.formatImage(item.ImageUrl, item.Callsign);
                                    })
                                    .execute();
                            }]
                        }
                    }
                }
            });
        }

        MenuServiceProvider.registerMenuItem({
            icon: 'local_taxi',
            title: 'Vehicles',
            subMenus: [
                {
                    state: 'root.vehicles.cards',
                    icon: 'local_taxi',
                    title: 'All'
                },
                {
                    title: 'Vehicle Types',
                    state: 'root.vehicle-types',
                    icon: 'icon-user-tie'
                }
            ]
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
