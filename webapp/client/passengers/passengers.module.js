(function(angular) {
    var module = angular.module('cab9.client.passengers', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('passengers')) return;

        $urlRouterProvider.when('/passengers', '/passengers/cards');

        $stateProvider.state('root.passengers', {
            url: '/passengers',
            abstract: true,
            default: 'root.passengers.cards',
            hasHelp: '/webapp/client/passengers/all/brands-help.modal.html',
            permission: 'Passengers Module',
            resolve: {
                rNavTo: function() {
                    return 'root.passengers.viewer.dashboard';
                },
                rId: function() {
                    return 'Id'
                },
                rData: ['Model', 'Auth', '$rootScope', function(Model, Auth, $rootScope) {
                    if ($rootScope.PERMISSIONS.permissions[0] != "superadmin") {
                        return Model.ClientStaff.query()
                            .filter("Id eq guid'" + Auth.getSession().Claims.ClientStaffId[0] + "'")
                            .include("Passengers/Client")
                            .execute().then(function(response) {
                                if (response[0].AllPassengers) {
                                    return Model.Passenger
                                        .query()
                                        .filter("ClientId eq guid'" + Auth.getSession().Claims.ClientId[0] + "'")
                                        .include('Client')
                                        .execute();
                                } else {
                                    return response[0].Passengers.map(function(item) {
                                        return new Model.Passenger(item)
                                    })
                                }
                            }, function(err) {
                                swal({
                                    title: "Some Error Occured.",
                                    text: "Some error has occured.",
                                    type: "error",
                                    confirmButtonColor: $UI.COLOURS.brandSecondary
                                });
                            })
                    } else {
                        return Model.Passenger
                            .query()
                            .filter("ClientId eq guid'" + Auth.getSession().Claims.ClientId[0] + "'")
                            .include('Client')
                            .execute();
                    }
                }],
                rQuery: ['Model', 'Auth', '$rootScope', function(Model, Auth, $rootScope) {
                    if ($rootScope.PERMISSIONS.permissions[0] != "superadmin") {
                        return Model.ClientStaff.query()
                            .filter("Id eq guid'" + Auth.getSession().Claims.ClientStaffId[0] + "'")
                            .include("Passengers/Client")
                            .execute().then(function(response) {
                                if (response[0].AllPassengers) {
                                    return Model.Passenger
                                        .query()
                                        .filter("ClientId eq guid'" + Auth.getSession().Claims.ClientId[0] + "'")
                                        .include('Client')
                                        .parseAs(Model.Passenger);
                                } else {
                                    return response[0].Passengers.map(function(item) {
                                        return new Model.Passenger(item)
                                    })
                                }
                            }, function(err) {
                                swal({
                                    title: "Some Error Occured.",
                                    text: "Some error has occured.",
                                    type: "error",
                                    confirmButtonColor: $UI.COLOURS.brandSecondary
                                });
                            })
                    } else {
                        return Model.Passenger
                            .query()
                            .filter("ClientId eq guid'" + Auth.getSession().Claims.ClientId[0] + "'")
                            .include('Client')
                            .parseAs(Model.Passenger);
                    }
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("(substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', Phone))")
                        }
                        return query.clone();
                    }
                }
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                    controller: ['$scope', 'rData', function($scope, rData) {
                        $scope.searchTerm = {};
                        $scope.serverSearchTerm = {};
                    }]
                },
                'options-area@root.passengers': {
                    templateUrl: '/webapp/client/passengers/all/passengers-module-options.partial.html',
                    controller: 'PassengersModuleOptionsController'
                },
                'stats-area@root.passengers': {
                    templateUrl: '/webapp/client/passengers/all/passengers-module-stats.partial.html',
                    controller: 'PassengersModuleStatsController'
                }
            }
        });

        $stateProvider.state('root.passengers.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item.Id;
                        },
                        Title: function(item) {
                            return item.Firstname + ' ' + item.Surname;
                        },
                        SubTitle: function(item) {
                            return (item.HomeAddress ? item.HomeAddress.Area : null);
                        },
                        LogoUrl: function(item) {
                            return item._ImageUrl;
                        },
                        Group: function(item) {
                            return item && item.Active.toString();
                        },
                        Score: function(item) {
                            return item.ScoreOverall;
                        }
                    };
                }]
            },
            views: {
                'view-area@root.passengers': {
                    templateUrl: '/e9_components/layouts/module/module-cards.partial.html',
                    controller: 'ModuleCardsController'
                }
            }
        });

        $stateProvider.state('root.passengers.table', {
            url: '/table',
            resolve: {
                rSchema: function() {
                    return 'Passenger';
                },
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'options-area@root.passengers': {
                    templateUrl: '/webapp/client/passengers/all/passengers-module-table-options.partial.html',
                    controller: 'PassengersModuleOptionsController'
                },
                'view-area@root.passengers': {
                    templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                    controller: 'ModulePagedTableController'
                }
            }
        });
        if ($permissions.test('passengers.viewer')) {
            $stateProvider.state('root.passengers.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.passengers.viewer.dashboard',
                viewerType: 'Passenger',
                permission: 'View Passenger',
                resolve: {
                    rTabs: ['$stateParams', function($stateParams) {
                        var tabs = [{
                            heading: 'Dashboard',
                            route: 'root.passengers.viewer.dashboard',
                            params: {
                                passengerId: $stateParams.Id
                            }
                        }];
                        tabs.push({
                            heading: 'Info',
                            route: 'root.passengers.viewer.info',
                            params: {
                                passengerId: $stateParams.Id
                            }
                        });
                        //tabs.push({
                        //    heading: 'Notes',
                        //    route: 'root.passengers.viewer.notes',
                        //    params: {
                        //        passengerId: $stateParams.Id
                        //    }
                        //});
                        tabs.push({
                            heading: 'Addresses',
                            route: 'root.passengers.viewer.addresses',
                            params: {
                                passengerId: $stateParams.Id
                            }
                        });
                        return tabs;
                    }],
                    rData: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.Passenger
                            .query()
                            .include('Client')
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .trackingEnabled()
                            .execute();
                    }],
                    rAccessors: ['$config', function($config) {
                        return {
                            Id: function(item) {
                                return item.Id;
                            },
                            Title: function(item) {
                                return item.Firstname + ' ' + item.Surname;
                            },
                            SubTitle: function(item) {
                                return (item.HomeAddress ? item.HomeAddress.Area : null);
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

            $stateProvider.state('root.passengers.viewer.dashboard', {
                url: '/dashboard',
                viewerType: 'Passenger',
                templateUrl: '/webapp/client/passengers/item/passenger-item-dashboard.partial.html',
                controller: 'PassengerItemDashboardController'
            });

            $stateProvider.state('root.passengers.viewer.info', {
                url: '/info',
                viewerType: 'Passenger',
                templateUrl: '/webapp/client/passengers/item/passenger-item-info.partial.html',
                controller: 'PassengerItemInfoController',
                resolve: {
                    'rPassengerTags': ['Model', function(Model) {
                        return Model.Tag
                            .query()
                            .execute()
                            .then(function(data) {
                                return data.filter(function(item) {
                                    return item.EntityType.indexOf("Passenger") != -1;
                                });
                            });
                    }]
                }
            });
        }


        $stateProvider.state('root.passengers.viewer.notes', {
            url: '/notes',
            viewerType: 'Notes',
            permission: 'Notes',
            controller: 'PassengerItemNotesController',
            templateUrl: '/webapp/client/passengers/item/passenger-item-notes.partial.html',
            resolve: {
                rNotes: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                    return Model.Note
                        .query()
                        .where("OwnerType eq 'PASSENGER'")
                        .where("OwnerId eq guid'" + $stateParams.Id + "'")
                        .execute();
                }],
                rStaffs: ['Model', function(Model) {
                    return Model.Staff
                        .query()
                        .select('Id, Firstname, Surname')
                        .parseAs(function(item) {
                            this.Name = item.Firstname + ' ' + item.Surname;
                            this.Id = item.Id
                        })
                        .execute();
                }],
                rUsers: ['Model', function(Model) {
                    return Model.User
                        .query()
                        .include('Claims')
                        .execute();
                }]
            }
        });
        $stateProvider.state('root.passengers.viewer.addresses', {
            url: '/addresses',
            viewerType: 'Addresses',
            permission: 'Addresses',
            controller: 'PassengerItemAddressesController',
            templateUrl: '/webapp/common/views/passenger-address/partial.html',
            resolve: {
                rAddresses: ['Model', '$stateParams', function(Model, $stateParams) {
                    return Model.PassengerAddress
                        .query()
                        .filter()
                        .where('PassengerId', '==', "guid'" + $stateParams.Id + "'")
                        .trackingEnabled()
                        .execute();
                }]
            }
        });
        if ($permissions.test('passengers', 'W')) {
            $stateProvider.state('root.passengers.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        controller: 'PassengerItemCreateController',
                        templateUrl: '/webapp/client/passengers/item/passenger-item-info.partial.html',
                        resolve: {
                            'rPassengerTags': ['Model', function(Model) {
                                return Model.PassengerTag
                                    .query()
                                    .execute();
                            }]
                        }
                    }
                }
            });
        }

        MenuServiceProvider.registerMenuItem({
            state: 'root.passengers.cards',
            icon: 'people_outline',
            title: 'Passengers'
        });

    }
    moduleRun.$inject = [];

    function moduleRun() {

    }
})(angular)