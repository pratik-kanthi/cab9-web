(function(window, angular) {
    var module = angular.module('cab9.client.staff', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('staff')) return;
        $stateProvider.state('root.bookers', {
            url: '/bookers',
            abstract: true,
            default: 'root.bookers.cards',
            viewerType: 'Client',
            permission: 'Client Staff',
            resolve: {
                rData: ['Model', '$rootScope', function(Model, $rootScope) {
                    return Model.ClientStaff
                        .query()
                        .filter("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                        .include("ClientStaffRole")
                        .top(100)
                        .execute().then(function(data) {
                            data.pullMore = Model.ClientStaff
                                .query()
                                .filter("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                                .include("ClientStaffRole")
                            return data;
                        });
                }],
                rQuery: ['Model', '$rootScope', function(Model, $rootScope) {
                    return Model.ClientStaff
                        .query()
                        .filter("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                        .include('ClientStaffRole')
                        // .select('Id,Name,AccountNo,ImageUrl,TownCity,ClientType/Name,ScoreOverall,Phone')
                        .parseAs(Model.ClientStaff);
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("(substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', ClientStaffRole/Name) or substringof('" + searchterms.$ + "', TownCity) or substringof('" + searchterms.$ + "', Phone))")
                        }
                        return query.clone();
                    }
                },
                rNavTo: function() {
                    return 'root.bookers.viewer.details';
                },
                rId: function() {
                    return 'sId'
                },
                rNavCards: function() {
                    return 'root.bookers.cards';
                },
                rNavTable: function() {
                    return 'root.bookers.table';
                },
                rCreateState: function() {
                    return "root.bookers.create"
                },
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item.Id;
                        },
                        Title: function(item) {
                            return item.Firstname + " " + item.Surname
                        },
                        LogoUrl: function(item) {
                            return item && item._ImageUrl;
                        },
                        Group: function(item) {
                            return item && item.Active.toString();
                        }
                    };
                }]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                    controller: ['$scope', function($scope) {
                        $scope.searchTerm = {};
                        $scope.serverSearchTerm = {};
                    }]
                },
                'options-area@root.bookers': {
                    templateUrl: '/webapp/common/views/clients/staff/options.partial.html',
                    controller: 'ClientStaffOptionsController'
                },
                'stats-area@root.bookers': {
                    templateUrl: '/webapp/common/views/clients/staff/all/staff-module-stats.partial.html',
                    controller: 'ClientStaffModuleStatsController'
                }
            }
        });
        if ($permissions.test('staff', 'W')) {
            $stateProvider.state('root.bookers.create', {
                url: '/create',
                resolve: {
                    rAccessors: ['$config', function($config) {
                        return {
                            Id: function(item) {
                                return item.Id;
                            },
                            Title: function(item) {
                                return item.Firstname + " " + item.Surname;
                            },
                            LogoUrl: function(item) {
                                return item._ImageUrl;
                            }
                        };
                    }],
                    rClientId: function() {
                        return null
                    },
                    rRoles: ['Model', function(Model) {
                        return Model.ClientStaffRole
                            .query()
                            .execute();
                    }],
                    rNav: function() {
                        return "'root.bookers.cards'"
                    }
                },
                views: {
                    'content-wrapper@root': {
                        controller: 'ClientStaffItemCreateController',
                        templateUrl: '/webapp/common/views/clients/staff/details/partial.html',
                    }
                }
            })
        }

        $stateProvider.state('root.bookers.cards', {
            url: '/cards',
            views: {
                'view-area@root.bookers': {
                    templateUrl: '/e9_components/layouts/module/module-secondary-cards.partial.html',
                    controller: 'ModuleSecondaryCardsController'
                }
            }
        });
        $stateProvider.state('root.bookers.table', {
            url: '/table',
            resolve: {
                rSchema: function() {
                    return 'Staff';
                },
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'options-area@root.bookers': {
                    templateUrl: '/webapp/common/views/clients/staff/table-options.partial.html',
                    controller: 'ClientStaffOptionsController'
                },
                'view-area@root.bookers': {
                    templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                    controller: 'ModulePagedTableController'
                }
            }
        });
        if ($permissions.test('staff.viewer')) {
            $stateProvider.state('root.bookers.viewer', {
                url: '/:sId',
                default: 'root.bookers.viewer.details',
                resolve: {
                    rData: ['Model', '$stateParams', '$rootScope', function(Model, $stateParams, $rootScope) {
                        return Model.ClientStaff
                            .query()
                            .where("Id eq guid'" + $stateParams.sId + "'")
                            .include("Passengers,ClientStaffRole")
                            .trackingEnabled()
                            .execute();
                    }],
                    rTabs: ['$stateParams', 'rData', function($stateParams, rData) {
                        var tabs = [{
                            heading: 'Details',
                            route: 'root.bookers.viewer.details'
                        }, {
                            heading: 'User',
                            route: 'root.bookers.viewer.user'
                        }];
                        if (!rData[0].AllPassengers) {
                            tabs.push({
                                heading: 'Passengers',
                                route: 'root.bookers.viewer.passengers'
                            })
                        }
                        return tabs;
                    }],
                    rAccessors: ['$config', function($config) {
                        return {
                            Id: function(item) {
                                return item.Id;
                            },
                            Title: function(item) {
                                return item._Fullname
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
            $stateProvider.state('root.bookers.viewer.details', {
                url: "/details",
                controller: 'ClientStaffItemDetailController',
                templateUrl: '/webapp/common/views/clients/staff/details/partial.html',
                resolve: {
                    rRoles: ['Model', function(Model) {
                        return Model.ClientStaffRole
                            .query()
                            .execute();
                    }],
                }
            })
            $stateProvider.state('root.bookers.viewer.user', {
                url: "/user",
                controller: 'ClientStaffItemUserController',
                templateUrl: '/webapp/common/views/clients/staff/user/partial.html',
                resolve: {
                    rUser: ['$http', '$stateParams', '$config', '$q', function($http, $stateParams, $config, $q) {
                        var deferred = $q.defer();
                        $http.get($config.API_ENDPOINT + "api/account/UserForOwner?ownerType=ClientStaffId&OwnerId=" + $stateParams.sId).then(function(response) {
                            deferred.resolve(response.data);
                        }, function(err) {
                            deferred.resolve({
                                Message: "User Not Found"
                            });
                        });
                        return deferred.promise;
                    }]
                }
            });
            $stateProvider.state('root.bookers.viewer.passengers', {
                url: "/passengers",
                controller: 'ClientStaffItemPassengerController',
                templateUrl: '/webapp/common/views/clients/staff/passengers/partial.html'
                // ,
                // resolve: {
                //     rPassengers: ['Model', '$rootScope', function(Model, $rootScope) {
                //         return Model.Passenger.query()
                //             .filter("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                //             .execute()
                //     }]
                // }
            })
        }
        MenuServiceProvider.registerMenuItem({
            state: 'root.bookers.cards',
            icon: 'group',
            title: 'Bookers'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }
})(window, angular);