(function(window, angular) {
    var module = angular.module('cab9.staff', []);

    module.config(moduleConfig);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('staff')) return;

        $urlRouterProvider.when('/staff', '/staff/cards');

        $stateProvider.state('root.staff', {
            url: '/staff',
            abstract: true,
            default: 'root.staff.cards',
            permission: 'Staff',
            resolve: {
                rData: ['Model', function(Model) {
                    return Model.Staff
                        .query()
                        .include('StaffRole')
                        .execute()
                }],
                rQuery: ['Model', function(Model) {
                    return Model.Staff
                        .query()
                        .include('StaffRole')
                        .parseAs(Model.Staff);
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', Email) or substringof('" + searchterms.$ + "', TownCity) or substringof('" + searchterms.$ + "', Phone)")
                        }
                        return query.clone();
                    }
                },
                rId: function() {
                    return 'Id';
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
                'options-area@root.staff': {
                    templateUrl: '/webapp/management/staff/all/staff-module-options.partial.html',
                    controller: 'StaffModuleOptionController'
                },
                'stats-area@root.staff': {
                    templateUrl: '/webapp/management/staff/all/staff-module-stats.partial.html',
                    controller: 'StaffModuleStatsController'
                }
            }
        });

        $stateProvider.state('root.staff.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item.Id;
                        },
                        Title: function(item) {
                            var subtitle = item.Firstname + ' ' + item.Surname;
                            return subtitle;
                        },
                        SubTitle: function(item) {
                            var title = '';
                            title += item.TownCity;
                            return title;
                        },
                        LogoUrl: function(item) {
                            return item._ImageUrl;
                        },
                        Group: function(item) {
                            return item.Active.toString();
                        },
                    };
                }],
                rNavTo: function() {
                    return 'root.staff.viewer.dashboard';
                }
            },
            views: {
                'view-area@root.staff': {
                    templateUrl: '/e9_components/layouts/module/module-cards.partial.html',
                    controller: 'ModuleCardsController'
                }
            }
        });

        $stateProvider.state('root.staff.table', {
            url: '/table',
            resolve: {
                rNavTo: function() {
                    return 'root.staff.viewer.dashboard';
                },
                rSchema: function() {
                    return 'Staff';
                },
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'options-area@root.staff': {
                    templateUrl: '/webapp/management/staff/all/staff-module-table-options.partial.html',
                    controller: 'StaffModuleOptionController'
                },
                'view-area@root.staff': {
                    templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                    controller: 'ModulePagedTableController'
                }
            }
        });

        if ($permissions.test('staff.viewer')) {
            $stateProvider.state('root.staff.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.staff.viewer.dashboard',
                viewerType: 'Staff',
                permission: 'View Staff',
                resolve: {
                    rTabs: ['$stateParams', function($stateParams) {
                        var tabs = [{
                            heading: 'Dashboard',
                            allow: true,
                            route: 'root.staff.viewer.dashboard',
                            params: {
                                staffId: $stateParams.Id
                            }
                        }, {
                            heading: 'Info',
                            route: 'root.staff.viewer.info',
                            allow: true,
                            params: {
                                staffId: $stateParams.Id
                            }
                        }, {
                            heading: 'User',
                            route: 'root.staff.viewer.user',
                            params: {
                                staffId: $stateParams.Id
                            }
                        }, {
                            heading: 'Documents',
                            route: 'root.staff.viewer.documents',
                            params: {
                                staffId: $stateParams.Id
                            }
                        }, {
                            heading: 'Notes',
                            route: 'root.staff.viewer.notes',
                            params: {
                                staffId: $stateParams.Id
                            }
                        }];

                        return tabs.filter(function(t) {
                            return t.allow || $permissions.test(t.route.substring(5));
                        });
                    }],
                    rData: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.Staff
                            .query()
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
                                return item._Fullname;
                            },
                            SubTitle: function(item) {
                                return item.TownCity;
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
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html'
                    }
                }
            });
            // viewer Dashboard State
            $stateProvider.state('root.staff.viewer.dashboard', {
                url: '/dashboard',
                viewerType: 'Staff',
                templateUrl: '/webapp/management/staff/item/staff-item-dashboard.partial.html',
                controller: 'StaffItemDashboardController'
            });

            if ($permissions.test('staff.viewer.documents')) {
                $stateProvider.state('root.staff.viewer.documents', {
                    url: '/documents',
                    viewerType: 'Staff',
                    permission: 'Staff - Documents',
                    controller: 'ModuleDocumentsController',
                    templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
                    resolve: {
                        rDocuments: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.Document
                                .query()
                                .where("OwnerType eq 'Staff'")
                                .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                .include("DocumentType")
                                .trackingEnabled()
                                .execute();
                        }],
                        rConfig: ['$stateParams', function($stateParams) {
                            return {
                                type: "Staff",
                                id: $stateParams.Id
                            };
                        }]
                    }
                });
            }

            $stateProvider.state('root.staff.viewer.info', {
                url: '/info',
                viewerType: 'Staff',
                templateUrl: '/webapp/management/staff/item/staff-item-info.partial.html',
                controller: 'StaffItemInfoController',
                resolve: {
                    'rCustomRoles': ['Model', function(Model) {
                        return Model.StaffRole
                            .query()
                            .execute();
                    }]
                }
            });

            if ($permissions.test('staff.viewer.notes')) {
                $stateProvider.state('root.staff.viewer.notes', {
                    url: '/notes',
                    viewerType: 'Notes',
                    permission: 'Staff - Notes',
                    controller: 'StaffItemNotesController',
                    templateUrl: '/webapp/management/staff/item/staff-item-notes.partial.html',
                    resolve: {
                        rNotes: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.Note
                                .query()
                                .where("OwnerType eq 'STAFF'")
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
            }
            if ($permissions.test('staff.viewer.user')) {
                $stateProvider.state('root.staff.viewer.user', {
                    url: "/user",
                    controller: 'StaffItemUserController',
                    templateUrl: '/webapp/management/staff/item/staff-item-user.partial.html',
                    permission: 'Staff - User',
                    resolve: {
                        rUser: ['$http', '$stateParams', '$config', '$q', function($http, $stateParams, $config, $q) {
                            var deferred = $q.defer();
                            $http.get($config.API_ENDPOINT + "api/account/UserForOwner?ownerType=StaffId&OwnerId=" + $stateParams.Id).then(function(response) {
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
            }
        }

        if ($permissions.test('staff', 'W')) {
            $stateProvider.state('root.staff.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        controller: 'StaffItemCreateController',
                        templateUrl: '/webapp/management/staff/item/staff-item-info.partial.html',
                        resolve: {
                            'rCustomRoles': ['Model', function(Model) {
                                return Model.StaffRole
                                    .query()
                                    .execute();
                            }]
                        }
                    }
                }
            });
        }

        MenuServiceProvider.registerMenuItem({
            state: 'root.staff.cards',
            icon: 'supervisor_account',
            title: 'Staff'
        });
    }

})(window, angular);