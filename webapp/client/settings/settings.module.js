(function(angular) {
    var module = angular.module('cab9.client.settings', []);

    module.config(moduleConfig);
    module.controller('SettingsController', SettingsController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('settings')) return;
        var sub = [];
        $stateProvider.state('root.settings', {
            url: '/settings',
            permission: 'Settings Module',
            resolve: {
                rMenu: [
                    function() {
                        return [];
                    }
                ]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/client/settings/settings.layout.html',
                    controller: 'SettingsController'
                }
            }
        });
        $urlRouterProvider.when('/settings', '/settings/details');

        if ($permissions.test('settings.details')) {
            sub.push({
                title: 'Details',
                state: 'root.settings.details',
                icon: 'icon-equalizer22'
            });
            $stateProvider.state('root.settings.details', {
                url: '/details',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/client/settings/details/details-config.partial.html',
                        controller: 'SettingsDetailsController'
                    }
                },
                resolve: {
                    'rData': ['Model', '$stateParams', 'Auth', '$q',
                        function(Model, $stateParams, Auth, $q) {
                            var defered = $q.defer();
                            Model.User
                                .query()
                                .where('Id', '==', "'" + Auth.getSession().UserId + "'")
                                .include('Claims')
                                .trackingEnabled()
                                .execute()
                                .then(function(user) {
                                    var clientClaim = user[0].Claims.filter(function(c) {
                                        return c.ClaimType == "ClientId"
                                    })[0];
                                    if (clientClaim) {
                                        Model.Client
                                            .query()
                                            .where('Id', '==', "guid'" + clientClaim.ClaimValue + "'")
                                            .trackingEnabled()
                                            .include('DefaultCurrency')
                                            .execute()
                                            .then(function(c) {
                                                defered.resolve(c);
                                            });
                                    }
                                });
                            return defered.promise;
                        }
                    ]
                }
            });
        }
        sub.push({
            title: 'Password',
            state: 'root.settings.profile',
            icon: 'icon-lock'
        });
        $stateProvider.state('root.settings.profile', {
            url: '/profile',
            views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/client/settings/profile/profile-config.partial.html',
                    controller: 'SettingsProfileController'
                }
            },
            resolve: {
                'rData': ['Model', '$stateParams', 'Auth', '$q',
                    function(Model, $stateParams, Auth, $q) {
                        var defered = $q.defer();
                        Model.User
                            .query()
                            .where('Id', '==', "'" + Auth.getSession().UserId + "'")
                            .include('Claims')
                            .trackingEnabled()
                            .execute()
                            .then(function(user) {
                                var clientClaim = user[0].Claims.filter(function(c) {
                                    return c.ClaimType == "ClientId"
                                })[0];
                                if (clientClaim) {
                                    Model.Client
                                        .query()
                                        .where('Id', '==', "guid'" + clientClaim.ClaimValue + "'")
                                        .trackingEnabled()
                                        .execute()
                                        .then(function(c) {
                                            defered.resolve(c);
                                        });
                                }
                            });
                        return defered.promise;
                    }
                ]
            }
        });
        if ($permissions.test('settings.webbooker')) {
            sub.push({
                title: 'Web Booker',
                state: 'root.settings.webbookersettings',
                icon: 'icon-lock'
            });
            $stateProvider.state('root.settings.webbookersettings', {
                url: '/webbookersettings',
                viewerType: 'WebBookerSettings',
                permission: 'webbookersettings',
                views: {
                    'settings-content@root.settings': {
                        controller: 'ClientItemWebBookerSettingsController',
                        templateUrl: '/webapp/common/views/clients/webBookerSettings/partial.html',
                    }
                },
                resolve: {
                    rSettings: ['$rootScope', 'Model', '$q', function($rootScope, Model, $q) {
                        return Model.ClientWebBookerSetting
                            .query()
                            .where("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                            .trackingEnabled()
                            .execute();
                    }]
                }
            });
        }
        if ($permissions.test('settings.references')) {
            sub.push({
                title: 'References',
                state: 'root.settings.references',
                icon: 'icon-equalizer22'
            })
            $stateProvider.state('root.settings.references', {
                url: '/references',
                views: {
                    'settings-content@root.settings': {
                        controller: 'ClientItemReferencesController',
                        templateUrl: '/webapp/common/views/clients/references/partial.html',
                    }
                },
                resolve: {
                    rReferences: ['$rootScope', 'Model', '$q', function($rootScope, Model, $q) {
                        return Model.ClientReference
                            .query()
                            .where("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                            .execute();
                    }]
                }
            });
        }

        sub.push({
            title: 'Profiles',
            state: 'root.settings.profiles',
            icon: 'icon-equalizer22'
        })
        $stateProvider.state('root.settings.profiles', {
            url: '/profiles',
             views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/management/clients/item/client-item-profiles.partial.html',
                    controller: ['$scope', 'rPassengers', '$stateParams', '$modal', '$http', '$config', function ClientItemProfilesController($scope, rPassengers, $stateParams, $modal, $http, $config) {
                        $scope.passengers = rPassengers
                        $scope.toggleSearch = toggleSearch;
                        $scope.toggleRow = toggleRow;
                        $scope.merge = merge;

                        function merge(pax, dupe) {
                            swal({
                                title: "Are you sure?",
                                text: "This will merge all bookings to target passenger and remove duplicate passenger.",
                                type: "warning",
                                showCancelButton: true,
                                confirmButtonText: "Yes, merge!",
                                closeOnConfirm: true
                            }, function (response) {
                                if (response)
                                    $http.get($config.API_ENDPOINT + 'api/client/merge', {
                                        params: {
                                            targetPassengerId: pax.Id,
                                            mergePassengerId: dupe.Id
                                        }
                                    }).then(function (response) {
                                        $http.get($config.API_ENDPOINT + 'api/client/duplicates', {
                                            params: {
                                                passengerId: pax.Id
                                            }
                                        }).then(function (response) {
                                            pax.dupes = response.data;
                                            var target = $scope.passengers.filter(function (p) {
                                                return p.Id == dupe.Id;
                                            })[0];
                                            if (target) {
                                                pax.Bookings += target.Bookings;
                                                var index = $scope.passengers.indexOf(target);
                                                $scope.passengers.splice(index, 1);
                                            }
                                        });
                                    });
                            });

                        }

                        function toggleRow(pax) {
                            pax.$expand = !pax.$expand

                            if (pax.$expand) {
                                $http.get($config.API_ENDPOINT + 'api/client/duplicates', {
                                    params: {
                                        passengerId: pax.Id
                                    }
                                }).then(function (response) {
                                    pax.dupes = response.data;
                                });
                            } else {
                                pax.dupes = null;
                            }
                        }

                        function toggleSearch() {
                            $scope.showSearch = !$scope.showSearch;
                            if (!$scope.showSearch) {
                                $scope.searchTerm.$ = '';
                            } else {
                                setTimeout(function () {
                                    $('#searchTerm').focus()
                                }, 500);
                            }
                        }

                        $scope.$watch('searchTerm.$', function (newValue, oldValue) {
                            if (newValue && newValue.trim() != "") {
                                $scope.passengers = rPassengers.filter(function (item) {
                                    return (item._Fullname + item.Phone + item.Mobile + item.Email + item._Addresses).toLowerCase().indexOf(newValue.toLowerCase()) != -1
                                });
                            } else {
                                $scope.passengers = angular.copy(rPassengers);

                            }
                        });

                    }],
                }
            },
            resolve: {
                'rPassengers': ['$http', 'Model', '$rootScope', function ($http, Model, $rootScope) {
                    return $http.get($config.API_ENDPOINT + 'api/client/profiles', {
                        params: {
                            clientId: $rootScope.CLIENTID
                        }
                    }).then(function (response) {
                        return response.data.map(function (x) { return new Model.PassengerProfile(x); });
                    });
                }]
            }
        });


        if ($permissions.test('settings.creditcards') && $permissions.cardPaymentsActive == true) {
            sub.push({
                title: 'Credit Cards',
                state: 'root.settings.creditcards.cards',
                icon: 'credit_card'
            });
            $stateProvider.state('root.settings.creditcards', {
                url: '/creditcards',
                viewerType: 'CreditCard',
                default: 'root.settings.creditcards.cards',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/client/settings/creditcards/partial.html',
                        controller: ['$scope', 'rTabs', function($scope, rTabs) {
                            $scope.tabDefs = rTabs;
                        }],
                    }
                },
                resolve: {
                    rTabs: [
                        function() {
                            return [{
                                heading: 'Credit Cards',
                                route: 'root.settings.creditcards.cards'
                            }, {
                                heading: 'Transactions',
                                route: 'root.settings.creditcards.transactions'
                            }]
                        }
                    ]
                }
            });
            $stateProvider.state('root.settings.creditcards.cards', {
                url: '/cards',
                templateUrl: '/webapp/common/views/clients/creditcards/cards/partial.html',
                controller: 'CreditCardsCardsController',
                resolve: {
                    rCards: ['Model', '$rootScope', function(Model, $rootScope) {
                        debugger;
                        return Model.PaymentCard
                            .query()
                            .where("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                            .where("Active eq true")
                            .execute()
                    }],
                    rClientId: ['$rootScope', function($rootScope) {
                        return $rootScope.CLIENTID;
                    }],
                    rPassengerId: ['$stateParams', function($stateParams) {
                        return null;
                    }],
                    rDriverId: ['$stateParams', function($stateParams) {
                        return null;
                    }]
                }
            });

            $stateProvider.state('root.settings.creditcards.transactions', {
                url: '/transactions',
                templateUrl: '/webapp/common/views/clients/creditcards/transactions/partial.html',
                controller: 'CreditCardsTransactionsController',
                resolve: {
                    rClientId: ['$rootScope', function($rootScope) {
                        return $rootScope.CLIENTID;
                    }],
                    rPassengerId: ['$stateParams', function($stateParams) {
                        return null;
                    }]
                }
            });
        }
                        
        if ($permissions.test('settings.googlemapsconfig')) {
            sub.push({
                title: 'Google Config',
                state: 'root.settings.googlemapsconfig',
                icon: 'icon-map'
            })
            $stateProvider.state('root.settings.googlemapsconfig', {
                url: '/googlemapsconfig',
                permission: 'Settings - Google Config',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/common/views/googlemapsconfig/partial.html',
                        controller: 'GoogleMapsConfigController'
                    }
                },
                resolve: {
                    rIntegration: ['Model',
                        function(Model) {
                            return Model.GoogleMapsConfig.query().execute();
                        }
                    ]
                }
            });
        }

        //#endregion
        var subMenus = sub;

        MenuServiceProvider.registerMenuItem({
            state: subMenus.length > 0 ? subMenus[0].state : 'root.settings.profile',
            icon: 'settings',
            title: 'Settings',
            subMenus: subMenus
        });
    }

    SettingsController.$inject = ['$scope', 'rMenu', '$rootScope'];

    function SettingsController($scope, rMenu, $rootScope) {        
        
        $scope.menu = rMenu;
        angular.forEach(rMenu, function(menuItem) { 
            menuItem.$html = _buildMenuItemTemplate(menuItem);
        })
        function _buildMenuItemTemplate(menuItem) {
            var template = '<a ui-sref="' + menuItem.state + '" ui-sref-opts="{reload: true}" style="color:white;width:100%;display:inline-block;">' +
                '<i class="' + menuItem.icon + '"></i>' +
                menuItem.title +
                '</a>';
            return template;
        }
    }


    
}(angular));
