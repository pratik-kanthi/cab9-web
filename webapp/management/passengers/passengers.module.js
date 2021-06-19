(function(angular) {
    var module = angular.module('cab9.passengers', []);

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
            hasHelp: '/webapp/management/passengers/all/brands-help.modal.html',
            permission: 'Passengers',
            resolve: {
                rQuery: ['Model', function(Model) {
                    return Model.Passenger
                        .query()
                        .include('Client')
                        .include('Addresses')
                        .parseAs(Model.Passenger);
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("substringof('" + searchterms.$ + "', Mobile) or substringof('" + searchterms.$ + "', Email) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', concat(concat(Firstname, ' '), Surname)) or substringof('" + searchterms.$ + "', Client/Name)")
                        }
                        return query.clone();
                    }
                },
                rId: function() {
                    return 'Id';
                },
                rStatsData: function() {
                    return null;
                },
                rNavTo: function() {
                    return 'root.passengers.viewer.dashboard';
                },
                rSchema: function() {
                    return 'Passenger';
                },
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/passengers/all/layout.partial.html',
                    controller: ['$scope', function($scope) {
                        $scope.searchTerm = {};
                        $scope.serverSearchTerm = {};
                    }]
                },
                'options-area@root.passengers': {
                    templateUrl: '/webapp/management/passengers/all/passengers-module-options.partial.html',
                    controller: 'PassengersModuleOptionsController'
                },
                'stats-area@root.passengers': {
                    templateUrl: '/webapp/management/passengers/all/passengers-module-stats.partial.html',
                    controller: 'PassengersModuleStatsController'
                }
            }
        });

        $stateProvider.state('root.passengers.table', {
            url: '/table',
            views: {
                'options-area@root.passengers': {
                    templateUrl: '/webapp/management/passengers/all/passengers-module-table-options.partial.html',
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
                        if ($permissions.test('passengers.viewer.notes')) {
                            tabs.push({
                                heading: 'Notes',
                                route: 'root.passengers.viewer.notes',
                                params: {
                                    passengerId: $stateParams.Id
                                }
                            });
                        }

                        if ($permissions.test('passengers.viewer.notes')) {
                            tabs.push({
                                heading: 'Loyalty Account',
                                route: 'root.passengers.viewer.loyalty-account',
                                params: {
                                    passengerId: $stateParams.Id
                                }
                            });
                        }

                        if ($permissions.test('passengers.viewer.addresses')) {
                            tabs.push({
                                heading: 'Addresses',
                                route: 'root.passengers.viewer.addresses',
                                params: {
                                    passengerId: $stateParams.Id
                                }
                            });
                        }
                        if ($permissions.test('passengers.viewer.creditcards')) {
                            tabs.push({
                                heading: 'Credit cards',
                                route: 'root.passengers.viewer.creditcards.cards',
                                params: {
                                    passengerId: $stateParams.Id
                                }
                            });
                        }
                        if ($permissions.test('passengers.viewer.banneddrivers')) {
                            tabs.push({
                                heading: 'Restrict Drivers',
                                route: 'root.passengers.viewer.banneddrivers',
                                params: {
                                    passengerId: $stateParams.Id
                                }
                            });
                        }
                        return tabs;
                    }],
                    rData: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.Passenger
                            .query()
                            .include('Client,BannedDrivers,Tags')
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

            //viewer dashboard state
            $stateProvider.state('root.passengers.viewer.dashboard', {
                url: '/dashboard',
                viewerType: 'Passenger',
                templateUrl: '/webapp/management/passengers/item/passenger-item-dashboard.partial.html',
                controller: 'PassengerItemDashboardController'
            });

            $stateProvider.state('root.passengers.viewer.info', {
                url: '/info',
                viewerType: 'Passenger',
                templateUrl: '/webapp/management/passengers/item/passenger-item-info.partial.html',
                controller: 'PassengerItemInfoController',
                resolve: {
                    rClients: ['Model', function(Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,ImageUrl,ClientType/Name')
                            .include('ClientType')
                            .parseAs(function(data) {
                                this.Id = data.Id;
                                this.Name = data.Name;
                                this.Description = data.ClientType.Name;
                                this.ImageUrl = window.formatImage(data.ImageUrl, data.Name);
                            })
                            .execute();
                    }],
                    rVehicleTypes: ['Model', function(Model) {
                        return Model.VehicleType
                            .query()
                            .select("Id, Name, ImageUrl")
                            .execute();
                    }],
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

            $stateProvider.state('root.passengers.viewer.loyalty-account',{
                url: '/loyalty-account',
                viewerType: 'Passenger',
                templateUrl: '/webapp/management/passengers/item/loyaltyAccount/partial.html',
                default: 'root.passengers.viewer.loyalty-account.info',
                resolve:{
                    rTabs: [
                        function () {
                            return [{
                                heading: 'Loyalty Account',
                                route: 'root.passengers.viewer.loyalty-account.info'
                            }, {
                                heading: 'Transactions',
                                route: 'root.passengers.viewer.loyalty-account.transactions'
                            }]
                        }
                    ],
                },
                controller: ['$scope', 'rTabs', function ($scope, rTabs) {
                    $scope.tabDefs = rTabs;
                }]
            });

            $stateProvider.state('root.passengers.viewer.loyalty-account.info', {
                url: '/info',
                views: {
                    'loyalty-tab-content@root.passengers.viewer.loyalty-account': {
                        templateUrl: '/webapp/management/passengers/item/loyaltyAccount/info/partial.html',
                        controller : 'LoyaltyAccountInfoController',
                        resolve:{
                            rLoyaltyInfo:['$stateParams','$http', function($stateParams, $http){
                                return $http.get('http://localhost:8081/v1.1/api/passenger/loyalty-account?passengerId=' + $stateParams.Id, function(response){
                                    return response;
                                });
                            }],
                        }
                    }
                },
            });

            $stateProvider.state('root.passengers.viewer.loyalty-account.transactions', {
                url: '/transactions',
                views: {
                    'loyalty-tab-content@root.passengers.viewer.loyalty-account': {
                        templateUrl: '/webapp/management/passengers/item/loyaltyAccount/transactions/partial.html',
                        controller : 'LoyaltyAccountTransactionsController',
                        resolve:{
                            rTransactions:['$stateParams','$http', function($stateParams, $http){
                                return $http.get('http://localhost:8081/v1.1/api/passenger/loyalty-transactions?passengerId=' + $stateParams.Id).success(function(data){
                                    return data;
                                });
                            }]
                        }
                    }
                }
            });

            if ($permissions.test('passengers.viewer.notes')) {
                $stateProvider.state('root.passengers.viewer.notes', {
                    url: '/notes',
                    viewerType: 'Notes',
                    permission: 'Passenger - Notes',
                    controller: 'PassengerItemNotesController',
                    templateUrl: '/webapp/management/passengers/item/passenger-item-notes.partial.html',
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
            }
            if ($permissions.test('passengers.viewer.addresses')) {
                $stateProvider.state('root.passengers.viewer.addresses', {
                    url: '/addresses',
                    viewerType: 'Addresses',
                    permission: 'Passenger - Addresses',
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
            }

            if ($permissions.test('passengers.viewer.creditcards')) {
                $stateProvider.state('root.passengers.viewer.creditcards', {
                    url: '/creditcards',
                    viewerType: 'CreditCard',
                    default: 'root.passengers.viewer.creditcards.cards',
                    permission: 'Passengers - Credit Cards',
                    templateUrl: '/webapp/management/passengers/item/creditcards/partial.html',
                    controller: ['$scope', 'rTabs', function($scope, rTabs) {
                        $scope.tabDefs = rTabs;
                    }],
                    resolve: {
                        rTabs: [
                            function() {
                                return [{
                                    heading: 'Credit Cards',
                                    route: 'root.passengers.viewer.creditcards.cards'
                                }, {
                                    heading: 'Transactions',
                                    route: 'root.passengers.viewer.creditcards.transactions'
                                }]
                            }
                        ]
                    }
                });
                $stateProvider.state('root.passengers.viewer.creditcards.cards', {
                    url: '/cards',
                    templateUrl: '/webapp/common/views/clients/creditcards/cards/partial.html',
                    controller: 'CreditCardsCardsController',
                    resolve: {
                        rCards: ['$http', 'Model', '$stateParams', function($http, Model, $stateParams) {
                            return Model.PaymentCard
                                .query()
                                .where("PassengerId eq guid'" + $stateParams.Id + "'")
                                .where("Active eq true")
                                .execute()
                        }],
                        rClientId: ['$stateParams', function($stateParams) {
                            return null;
                        }],
                        rPassengerId: ['$stateParams', function($stateParams) {
                            return $stateParams.Id;
                        }],
                        rDriverId: ['$stateParams', function($stateParams) {
                            return null;
                        }]
                    }
                });
                $stateProvider.state('root.passengers.viewer.creditcards.transactions', {
                    url: '/transactions',
                    templateUrl: '/webapp/common/views/clients/creditcards/transactions/partial.html',
                    controller: 'CreditCardsTransactionsController',
                    resolve: {
                        rClientId: ['$stateParams', function($stateParams) {
                            return null;
                        }],
                        rPassengerId: ['$stateParams', function($stateParams) {
                            return $stateParams.Id;
                        }]
                    }
                });
            }

            if ($permissions.test('passengers.viewer.banneddrivers')) {
                $stateProvider.state('root.passengers.viewer.banneddrivers', {
                    url: '/restrictdrivers',
                    viewerType: 'BannedDrivers',
                    permission: 'Passenger - Blocked Drivers',
                    controller: 'PassengerItemBannedDriversController',
                    templateUrl: '/webapp/management/passengers/item/bannedDrivers/partial.html'
                });
            }
        }

        MenuServiceProvider.registerMenuItem({
            state: 'root.passengers.table',
            icon: 'people_outline',
            title: 'Passengers'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }

}(angular))