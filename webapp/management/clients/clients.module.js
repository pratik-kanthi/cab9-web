(function(angular) {
    var module = angular.module('cab9.clients', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('clients')) return;

        $urlRouterProvider.when('/clients', '/clients/cards');

        $stateProvider.state('root.clients', {
            url: '/clients',
            abstract: true,
            default: 'root.clients.cards',
            permission: 'Clients',
            hasHelp: '/webapp/management/clients/all/brands-help.modal.html',
            resolve: {
                rData: ['Model', function(Model) {
                    return Model.Client
                        .query()
                        .include('ClientType')
                        .select('Id,Name,AccountNo,ImageUrl,TownCity,ClientType/Name,ScoreOverall,Phone')
                        .top(100)
                        .orderBy('Name')
                        .trackingEnabled()
                        .execute().then(function(data) {
                            data.pullMore = Model.Client
                                .query()
                                .include('ClientType')
                                .select('Id,Name,AccountNo,ImageUrl,TownCity,ClientType/Name,ScoreOverall,Phone')
                                .trackingEnabled();
                            return data;
                        });
                }],
                rId: function() {
                    return 'Id';
                },
                rQuery: ['Model', function(Model) {
                    return Model.Client
                        .query()
                        .include('ClientType')
                        // .select('Id,Name,AccountNo,ImageUrl,TownCity,ClientType/Name,ScoreOverall,Phone')
                        .parseAs(Model.Client);
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("(substringof('" + searchterms.$ + "', Name) or substringof('" + searchterms.$ + "', ClientType/Name) or substringof('" + searchterms.$ + "', AccountNo) or substringof('" + searchterms.$ + "', TownCity) or substringof('" + searchterms.$ + "', Phone))")
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
                'options-area@root.clients': {
                    templateUrl: '/webapp/management/clients/all/clients-module-options.partial.html',
                    controller: 'ClientsModuleOptionsController'
                },
                'stats-area@root.clients': {
                    templateUrl: '/webapp/management/clients/all/clients-module-stats.partial.html',
                    controller: 'ClientsModuleStatsController'
                }
            }
        });

        $stateProvider.state('root.clients.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config', function($config) {
                    return {
                        Id: function(item) {
                            return item && item.Id;
                        },
                        Title: function(item) {
                            return item && item.Name;
                        },
                        SubTitle: function(item) {
                            return item && item.AccountNo;
                        },
                        LogoUrl: function(item) {
                            return item && item._ImageUrl;
                        },
                        Group: function(item) {
                            return item && item.ClientType && item.ClientType.Name
                        },
                        Score: function(item) {
                            return item && item.ScoreOverall;
                        }
                    };
                }],
                rNavTo: function() {
                    return 'root.clients.viewer.dashboard';
                }
            },
            views: {
                'view-area@root.clients': {
                    templateUrl: '/e9_components/layouts/module/module-cards.partial.html',
                    controller: 'ModuleCardsController'
                }
            }
        });

        $stateProvider.state('root.clients.table', {
            url: '/table',
            resolve: {
                rNavTo: function() {
                    return 'root.clients.viewer.dashboard';
                },
                rSchema: function() {
                    return 'Client';
                },
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'options-area@root.clients': {
                    templateUrl: '/webapp/management/clients/all/clients-module-table-options.partial.html',
                    controller: 'ClientsModuleOptionsController'
                },
                'view-area@root.clients': {
                    templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                    controller: 'ModulePagedTableController'
                }
            }
        });

        if ($permissions.test('clients.viewer')) {
            $stateProvider.state('root.clients.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.clients.viewer.dashboard',
                viewerType: 'Client',
                permission: 'View Client',
                resolve: {
                    rData: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.Client
                            .query()
                            .where('Id', '==', "guid'" + $stateParams.Id + "'")
                            .include('ClientType,Tags,DefaultCurrency,BannedDrivers,VehicleTypes,CancellationRule')
                            .trackingEnabled()
                            .execute();
                    }],
                    rTabs: ['$stateParams', 'rData', function($stateParams, rData) {
                        var tabs = [{
                                heading: 'Dashboard',
                                route: 'root.clients.viewer.dashboard',
                                allow: true,
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }, {
                                heading: 'Info',
                                route: 'root.clients.viewer.info',
                                allow: true,
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }, {
                                heading: 'Bookings',
                                route: 'root.clients.viewer.bookings',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }, {
                                heading: 'Staff',
                                route: 'root.clients.viewer.staff.cards',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }, {
                                heading: 'Documents',
                                route: 'root.clients.viewer.documents',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }, {
                                heading: 'Passengers',
                                test: 'clients.viewer.passengers',
                                route: 'root.clients.viewer.passengers.table',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Profiles',
                                route: 'root.clients.viewer.profiles',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'References',
                                route: 'root.clients.viewer.references',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Notes',
                                route: 'root.clients.viewer.notes',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Blocked',
                                route: 'root.clients.viewer.banneddrivers',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Invoices',
                                route: 'root.clients.viewer.invoices',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Credit Notes',
                                route: 'root.clients.viewer.credits',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Adjustments',
                                route: 'root.clients.viewer.adjustments',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Fixed Prices',
                                route: 'root.clients.viewer.fixeds',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Locations',
                                route: 'root.clients.viewer.locations',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Web Booker',
                                route: 'root.clients.viewer.webbookersettings',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'History',
                                route: 'root.clients.viewer.history',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            }, {
                                heading: 'Advanced',
                                route: 'root.clients.viewer.advanced',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            },
                            {
                                heading: 'Credit Cards',
                                route: 'root.clients.viewer.creditcards.cards',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            },
                            {
                                heading: 'Invite To App',
                                route: 'root.clients.viewer.invitetoapp',
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }
                        ];


                        if (!rData[0].AllVehicleTypeAccess) {
                            tabs.push({
                                heading: 'Vehicle Types',
                                route: 'root.clients.viewer.vehicletypes',
                                params: {
                                    clientId: $stateParams.Id
                                },
                            })
                        }
                        tabs = tabs.filter(function(t) {
                            return t.allow || $permissions.test(t.test || t.route.substring(5));
                        });
                        return tabs;
                    }],
                    rAccessors: ['$config', function($config) {
                        return {
                            Id: function(item) {
                                return item.Id;
                            },
                            Title: function(item) {
                                if (item.AccountNo) {
                                    return '(' + item.AccountNo + ') ' + item.Name;
                                } else {
                                    return item.Name;
                                }
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
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                    }
                }
            });

            //viewer dashboard state
            $stateProvider.state('root.clients.viewer.dashboard', {
                url: '/dashboard',
                viewerType: 'Client',
                templateUrl: '/webapp/management/clients/item/client-item-dashboard.partial.html',
                controller: 'ClientItemDashboardController'
            });

            $stateProvider.state('root.clients.viewer.history', {
                url: '/history',
                viewerType: 'Client',
                permission: 'Client - History',
                templateUrl: '/webapp/management/clients/item/client-item-history.partial.html',
                resolve: {
                    rHistory: ['Model', '$stateParams',
                        function(Model, $stateParams) {
                            return Model.AuditRecord
                                .query()
                                .include('Properties')
                                .include('User')
                                .trackingEnabled()
                                .where('EntityId', 'eq', "guid'" + $stateParams.Id + "'")
                                .where('EntityType', 'eq', "'Client'")
                                .orderBy('Timestamp desc')
                                .execute();
                        }
                    ],
                },
                controller: ['$scope', 'rHistory', function($scope, rHistory) {
                    $scope.iconsIndex = {
                        "Modified": "assignment",
                        "ImageUpdate": "assignment"
                    }

                    $scope.coloursIndex = {
                        "Modified": "orange-bg",
                        "ImageUpdate": "orange-bg"
                    }

                    $scope.noHistory = false;
                    $scope.history = {};

                    $scope.getImage = function(path) {
                        if (path) {
                            if (path.slice(0, 4) == 'http') {
                                return path;
                            } else {
                                return $config.API_ENDPOINT + path;
                            }
                        } else {
                            var n = rData[0].Callsign;
                            var spaceIndex = n.indexOf(' ');
                            if (spaceIndex != -1) {
                                n = n.substring(0, spaceIndex);
                            }
                            return $config.API_ENDPOINT + 'api/imagegen?text=' + n;
                        }
                    }

                    if (rHistory.length == 0) {
                        $scope.noHistory = true;
                    }
                    angular.forEach(rHistory, function(x) {
                        var date = moment(x.Timestamp).format('DD MMM YYYY');
                        if (!$scope.history[date]) {
                            $scope.history[date] = [];
                        }
                        $scope.history[date].push(x);
                    });
                }]
            });

            $stateProvider.state('root.clients.viewer.fixeds', {
                url: '/fixeds',
                viewerType: 'Client',
                permission: 'Client - Fixed Prices',
                templateUrl: '/webapp/management/clients/item/fixed/partial.html',
                controller: 'ClientFixedController',
                resolve: {
                    rFixedCount: ['Model', '$stateParams',
                        function(Model, $stateParams) {
                            return Model.ClientPricingFixed.query()
                                .select('Id')
                                .parseAs(function(data) {
                                    this.Id = data.Id;
                                })
                                .where('ClientId', 'eq', "guid'" + $stateParams.Id + "'")
                                .execute()
                        }
                    ],
                    rFixeds: ['$http', 'Model', '$stateParams', function ($http, Model, $stateParams) {
                        return $http.get($config.API_ENDPOINT + 'api/PricingModels/FetchFixedClientDetails?clientId=' + $stateParams.Id + '&count=200').then(function (response) {
                            if (response.data.length > 0) {
                                return response.data.map(function (x) {
                                    return new Model.ClientPricingFixed(x);
                                });
                            }
                        });
                    }],
                    rVehicleTypes: ['Model',
                        function(Model) {
                            return Model.VehicleType.query().trackingEnabled().execute();
                        }
                    ],
                    rZones: ['Model',
                        function(Model) {
                            return Model.Zone.query().execute();
                        }
                    ],
                }
            });

            $stateProvider.state('root.clients.viewer.info', {
                url: '/info',
                viewerType: 'Client',
                templateUrl: '/webapp/management/clients/item/client-item-info.partial.html',
                controller: 'ClientItemInfoController',
                resolve: {
                    'rClientTypes': ['LookupCache', 'Model', function(LookupCache, Model) {
                        if (LookupCache.ClientType && LookupCache.ClientType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                            return LookupCache.ClientType;
                        } else {
                            return Model.ClientType
                                .query()
                                .execute()
                                .then(function(data) {
                                    LookupCache.ClientType = data;
                                    LookupCache.ClientType.$updated = new moment();
                                    return LookupCache.ClientType;
                                });
                        }
                    }],
                    'rVehicleTypes': ['LookupCache', 'Model', function (LookupCache, Model) {
                        if (LookupCache.VehicleType && LookupCache.VehicleType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                            return LookupCache.VehicleType;
                        } else {
                            return Model.VehicleType
                                .query()
                                .execute()
                                .then(function (data) {
                                    LookupCache.VehicleType = data.sort(function (a, b) {
                                        return (a.Priority || 99) - (b.Priority || 99);
                                    });
                                    LookupCache.VehicleType.$updated = new moment();
                                    return LookupCache.VehicleType;
                                });
                        }
                    }],
                    'rPricingModels': ['Model', function(Model) {
                        return Model.PricingModel
                            .query()
                            .execute();
                    }],
                    'rClientTags': ['Model', function(Model) {
                        return Model.Tag
                            .query()
                            .execute()
                            .then(function(data) {
                                return data.filter(function(item) {
                                    return item.EntityType.indexOf("Client") != -1;
                                });
                            });
                    }],
                    rValidations: ['Model', '$stateParams', function(Model, $stateParams) {
                        return Model.ClientReference
                            .query()
                            .where("ClientId eq guid'" + $stateParams.Id + "'")
                            .parseAs(function(i) {
                                return {
                                    Id: i.ReferenceName,
                                    Name: i.ReferenceName
                                }
                            })
                            .execute();
                    }],
                    rStaff: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.Staff
                            .query()
                            .select('Id,Firstname,Surname')
                            .parseAs(function (i) {
                                return {
                                    Id: i.Id,
                                    Name: i.Firstname + ' ' + i.Surname
                                }
                            })
                            .execute();
                    }],
                    'rTaxes': ['Model', function (Model) {
                        return Model.Tax
                            .query()
                            .select('Id,Name')
                            .execute();
                    }]
                }
            });

            if ($permissions.test('clients.viewer.bookings')) {
                $stateProvider.state('root.clients.viewer.bookings', {
                    url: '/bookings',
                    viewerType: 'Client',
                    permission: 'Client - Bookings',
                    templateUrl: '/webapp/common/views/bookings/partial.html',
                    controller: 'ClientBookingsController'
                });
            }

            if ($permissions.test('clients.viewer.locations')) {
                $stateProvider.state('root.clients.viewer.locations', {
                    url: '/locations',
                    viewerType: 'Client',
                    permission: 'Client - Locations',
                    templateUrl: '/webapp/management/clients/item/client-item-locations.partial.html',
                    controller: 'ClientItemLocationsController',
                    resolve: {
                        'rLocations': ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.Client.query().select('Id,KnownLocations').include('KnownLocations').filter("Id eq guid'" + $stateParams.Id + "'").execute();
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.documents')) {
                $stateProvider.state('root.clients.viewer.documents', {
                    url: '/documents',
                    viewerType: 'Client',
                    permission: 'Client - Documents',
                    controller: 'ModuleDocumentsController',
                    templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
                    resolve: {
                        rDocuments: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.Document
                                .query()
                                .where("OwnerType eq 'Client'")
                                .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .include("DocumentType")
                                .execute();
                        }],
                        rConfig: ['$stateParams', function($stateParams) {
                            return {
                                type: "Client",
                                id: $stateParams.Id
                            };
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.passengers')) {
                $stateProvider.state('root.clients.viewer.passengers', {
                    url: '/passengers',
                    abstract: true,
                    default: 'root.clients.viewer.passengers.table',
                    viewerType: 'Client',
                    permission: 'Client - Passengers',
                    resolve: {
                        rNavTo: function() {
                            return 'root.passengers.viewer.dashboard';
                        },
                        rId: function() {
                            return 'Id';
                        },
                        rSchema: function() {
                            return 'Passenger';
                        },
                        rQuery: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.Passenger
                                .query()
                                .filter("ClientId eq guid'" + $stateParams.Id + "'")
                                .include('Client')
                                .include('Addresses')
                                .parseAs(Model.Passenger);
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
                        '': {
                            templateUrl: '/e9_components/layouts/module/module-base-full.layout.html',
                            controller: ['$scope', 'rData', function($scope, rData) {
                                $scope.searchTerm = {};
                                $scope.serverSearchTerm = {};
                            }]
                        },
                        'options-area@root.clients.viewer.passengers': {
                            templateUrl: '/webapp/common/views/clients/passengers/options.partial.html',
                            controller: 'ClientPassengersOptionsController'
                        }
                    }
                });

                $stateProvider.state('root.clients.viewer.passengers.table', {
                    url: '/table',
                    resolve: {
                        rAccessors: ['$config', function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                }
                            }
                        }],
                        rColumns: function() {
                            return null;
                        }
                    },
                    views: {
                        'view-area@root.clients.viewer.passengers': {
                            templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                            controller: 'ModulePagedTableController'
                        }
                    }
                });
            };

            if ($permissions.test('clients.viewer.profiles')) {
                $stateProvider.state('root.clients.viewer.profiles', {
                    url: '/profiles',
                    viewerType: 'Client',
                    permission: 'Client - Profiles',
                    templateUrl: '/webapp/management/clients/item/client-item-profiles.partial.html',
                    controller: 'ClientItemProfilesController',
                    resolve: {
                        'rPassengers': ['$http', 'Model', '$stateParams', function($http, Model, $stateParams) {
                            return $http.get($config.API_ENDPOINT + 'api/client/profiles', {
                                params: {
                                    clientId: $stateParams.Id
                                }
                            }).then(function(response) {
                                return response.data.map(function(x) {
                                    return new Model.PassengerProfile(x);
                                });
                            });
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.invoices')) {
                $stateProvider.state('root.clients.viewer.invoices', {
                    url: '/invoices',
                    viewerType: 'Invoices',
                    permission: 'Client - Invoices',
                    controller: 'ClientInvoicesController',
                    templateUrl: '/webapp/common/views/clients/invoices/partial.html'
                })
            }

            if ($permissions.test('clients.viewer.credits')) {
                $stateProvider.state('root.clients.viewer.credits', {
                    url: '/credit-notes',
                    viewerType: 'CreditNotes',
                    permission: 'Client - Credit Notes',
                    controller: 'ClientCreditNotesController',
                    templateUrl: '/webapp/common/views/clients/creditNotes/partial.html'
                })
            }

            if ($permissions.test('clients.viewer.adjustments')) {
                $stateProvider.state('root.clients.viewer.adjustments', {
                    url: '/adjustments',
                    viewerType: 'Adjustments',
                    permission: 'Client - Adjustments',
                    controller: 'ClientItemAdjustmentsController',
                    templateUrl: '/webapp/management/clients/item/client-item-adjustments.partial.html',
                    resolve: {
                        rAdjustments: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.ClientAdjustment
                                .query()
                                .include('Tax')
                                .where("ClientId eq guid'" + $stateParams.Id + "'")
                                .execute();
                        }],
                        rRecurring: function() {
                            return false
                        }
                    }
                })
            }

            if ($permissions.test('clients.viewer.notes')) {
                $stateProvider.state('root.clients.viewer.notes', {
                    url: '/notes',
                    viewerType: 'Notes',
                    permission: 'Client - Notes',
                    controller: 'ClientItemNotesController',
                    templateUrl: '/webapp/management/clients/item/client-item-notes.partial.html',
                    resolve: {
                        rNotes: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.Note
                                .query()
                                .where("OwnerType eq 'CLIENT'")
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

            if ($permissions.test('clients.viewer.banneddrivers')) {
                $stateProvider.state('root.clients.viewer.banneddrivers', {
                    url: '/banneddrivers',
                    viewerType: 'BannedDrivers',
                    permission: 'Client - Blocked Drivers',
                    controller: 'ClientItemBannedDriversController',
                    templateUrl: '/webapp/common/views/clients/bannedDrivers/partial.html'
                });
            }

            if ($permissions.test('clients.viewer.references')) {
                $stateProvider.state('root.clients.viewer.references', {
                    url: '/references',
                    viewerType: 'References',
                    permission: 'Client - References',
                    controller: 'ClientItemReferencesController',
                    templateUrl: '/webapp/common/views/clients/references/partial.html',
                    resolve: {
                        rReferences: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.ClientReference
                                .query()
                                .where("ClientId eq guid'" + $stateParams.Id + "'")
                                .execute();
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.webbookersettings')) {
                $stateProvider.state('root.clients.viewer.webbookersettings', {
                    url: '/webbookersettings',
                    viewerType: 'WebBookerSettings',
                    permission: 'Client - Web Booker',
                    controller: 'ClientItemWebBookerSettingsController',
                    templateUrl: '/webapp/common/views/clients/webBookerSettings/partial.html',
                    resolve: {
                        rSettings: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.ClientWebBookerSetting
                                .query()
                                .where("ClientId eq guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .execute();
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.advanced')) {
                $stateProvider.state('root.clients.viewer.advanced', {
                    url: '/advanced',
                    viewerType: 'Advanced',
                    permission: 'Client - Advanced',
                    controller: 'ClientItemAdvancedController',
                    templateUrl: '/webapp/management/clients/item/advanced/partial.html',
                    resolve: {
                        rVehicleTypes: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.VehicleType
                                .query()
                                .execute()
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.invitetoapp')) {
                $stateProvider.state('root.clients.viewer.invitetoapp', {
                    url: '/invite',
                    viewerType: 'Client',
                    permission: 'Client - Invite',
                    templateUrl: '/webapp/management/clients/item/invite/partial.html',
                    controller: 'ClientInviteToAppController'
                });
            }

            if ($permissions.test('clients.viewer.creditcards')) {
                $stateProvider.state('root.clients.viewer.creditcards', {
                    url: '/creditcards',
                    viewerType: 'CreditCard',
                    default: 'root.clients.viewer.creditcards.cards',
                    permission: 'Client - Credit Cards',
                    templateUrl: '/webapp/management/clients/item/creditcards/partial.html',
                    controller: ['$scope', 'rTabs', function($scope, rTabs) {
                        $scope.tabDefs = rTabs;
                    }],
                    resolve: {
                        rTabs: [
                            function() {
                                return [{
                                    heading: 'Credit Cards',
                                    route: 'root.clients.viewer.creditcards.cards'
                                }, {
                                    heading: 'Transactions',
                                    route: 'root.clients.viewer.creditcards.transactions'
                                }]
                            }
                        ]
                    }
                });
                $stateProvider.state('root.clients.viewer.creditcards.cards', {
                    url: '/cards',
                    templateUrl: '/webapp/common/views/clients/creditcards/cards/partial.html',
                    controller: 'CreditCardsCardsController',
                    resolve: {
                        rCards: ['$http', 'Model', '$stateParams', function($http, Model, $stateParams) {
                            return Model.PaymentCard
                                .query()
                                .where("ClientId eq guid'" + $stateParams.Id + "'")
                                .where("Active eq true")
                                .execute()
                        }],
                        rClientId: ['$stateParams', function($stateParams) {
                            return $stateParams.Id;
                        }],
                        rPassengerId: ['$stateParams', function($stateParams) {
                            return null;
                        }],
                        rDriverId: ['$stateParams', function($stateParams) {
                            return null;
                        }]
                    }
                });

                $stateProvider.state('root.clients.viewer.creditcards.transactions', {
                    url: '/transactions',
                    templateUrl: '/webapp/common/views/clients/creditcards/transactions/partial.html',
                    controller: 'CreditCardsTransactionsController',
                    resolve: {
                        rClientId: ['$stateParams', function($stateParams) {
                            return $stateParams.Id;
                        }],
                        rPassengerId: ['$stateParams', function($stateParams) {
                            return null;
                        }]
                    }
                });
            }

            //$urlRouterProvider.when('/creditcards', '/creditcards/cards');

            if ($permissions.test('clients.viewer.vehicletypes')) {
                $stateProvider.state('root.clients.viewer.vehicletypes', {
                    url: "/vehicletypes",
                    viewerType: 'VehicleTypes',
                    permission: 'Client - Vehicle Types',
                    controller: 'ClientItemVehicleTypesController',
                    templateUrl: '/webapp/common/views/clients/clientVehicleTypes/partial.html',
                    resolve: {
                        rVehicleTypes: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.VehicleType
                                .query()
                                .execute()
                        }]
                    }
                });
            }

            if ($permissions.test('clients.viewer.staff', 'W')) {
                $stateProvider.state('root.clients.viewer.staff.create', {
                    url: '/create',
                    resolve: {
                        rAccessors: ['$config', function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                },
                                Title: function(item) {
                                    return item.Firstname + item.Surname
                                },
                                LogoUrl: function(item) {
                                    return item._ImageUrl;
                                }
                            };
                        }],
                        rRoles: ['Model', function(Model) {
                            return Model.ClientStaffRole
                                .query()
                                .execute();
                        }]
                    },
                    views: {
                        'content-wrapper@root': {
                            controller: 'ClientStaffItemCreateController',
                            templateUrl: '/webapp/common/views/clients/staff/details/partial.html',
                        }
                    }
                })
            }

            if ($permissions.test('clients.viewer.staff')) {
                $stateProvider.state('root.clients.viewer.staff', {
                    url: '/staff',
                    abstract: true,
                    default: 'root.clients.viewer.staff.cards',
                    viewerType: 'Client',
                    permission: 'Client - Staff',
                    resolve: {
                        rNavTo: function() {
                            return 'root.clients.viewer.staff.viewer.details';
                        },
                        rId: function() {
                            return 'sId';
                        },
                        rData: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.ClientStaff.query()
                                .filter("ClientId eq guid'" + $stateParams.Id + "'")
                                .select('Id,Active,Firstname, Surname, Phone,ClientStaffRole/Name')
                                .include('ClientStaffRole')
                                .top(100)
                                .orderBy('Firstname')
                                .execute().then(function(data) {
                                    data.pullMore = Model.ClientStaff.query()
                                        .filter("ClientId eq guid'" + $stateParams.Id + "'")
                                        .select('Id,Active,Firstname, Surname, Phone,ClientStaffRole/Name')
                                        .include('ClientStaffRole')
                                        .orderBy('Firstname');
                                    return data;
                                });
                        }],

                        rCreateState: function() {
                            return "root.clients.viewer.staff.create"
                        },
                        rNavCards: function() {
                            return 'root.clients.viewer.staff.cards';
                        },
                        rNavTable: function() {
                            return 'root.clients.viewer.staff.table';
                        },
                        rQuery: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.ClientStaff
                                .query()
                                .filter("ClientId eq guid'" + $stateParams.Id + "'")
                                .include('ClientStaffRole')
                                .select('Id,Firstname,Surname,Phone,Mobile,Email,AllPassengers,ClientStaffRole/Name')
                                .parseAs(Model.ClientStaff);
                        }],
                        rServerSearch: function() {
                            return function(query, searchterms) {
                                if (searchterms.$) {
                                    query.where("(substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', ClientStaffRole/Name) or substringof('" + searchterms.$ + "', TownCity) or substringof('" + searchterms.$ + "', Phone) or substringof('" + searchterms.$ + "', Email))")
                                }
                                return query.clone();
                            }
                        }

                    },
                    views: {
                        '': {
                            templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                            controller: ['$scope', 'rData', function($scope, rData) {
                                $scope.searchTerm = {};
                                $scope.serverSearchTerm = {};
                            }]
                        },
                        'options-area@root.clients.viewer.staff': {
                            templateUrl: '/webapp/common/views/clients/staff/options.partial.html',
                            controller: 'ClientStaffOptionsController'
                        },
                        'stats-area@root.clients.viewer.staff': {
                            templateUrl: '/webapp/common/views/clients/staff/all/staff-module-stats.partial.html',
                            controller: 'ClientStaffModuleStatsController'
                        }
                    }
                });


                $stateProvider.state('root.clients.viewer.staff.cards', {
                    url: '/cards',
                    resolve: {
                        rAccessors: ['$config', function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                },
                                Title: function(item) {
                                    return item.Firstname + ' ' + item.Surname
                                },
                                SubTitle: function(item) {
                                    return item.ClientStaffRole && item.ClientStaffRole.Name
                                },
                                LogoUrl: function(item) {
                                    return item._ImageUrl;
                                },
                                Group: function(item) {
                                    return item && item.Active.toString();
                                },
                            };
                        }]
                    },
                    views: {
                        'view-area@root.clients.viewer.staff': {
                            templateUrl: '/e9_components/layouts/module/module-secondary-cards.partial.html',
                            controller: 'ModuleSecondaryCardsController'
                        }
                    }
                })

                $stateProvider.state('root.clients.viewer.staff.table', {
                    url: '/table',
                    resolve: {
                        rAccessors: ['$config', function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                }
                            }
                        }],
                        rSchema: function() {
                            return 'ClientStaff';
                        },
                        rColumns: function() {
                            return null;
                        }
                    },
                    views: {
                        'view-area@root.clients.viewer.staff': {
                            templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                            controller: 'ModulePagedTableController'
                        }
                    }
                })
            }

            $stateProvider.state('root.clients.viewer.staff.viewer', {
                url: '/:sId',
                default: 'root.clients.viewer.staff.viewer.details',
                resolve: {
                    rData: ['Model', '$stateParams', '$rootScope', function(Model, $stateParams, $rootScope) {
                        return Model.ClientStaff
                            .query()
                            .where("Id eq guid'" + $stateParams.sId + "'")
                            .include("Passengers,ClientStaffRole")
                            .trackingEnabled()
                            .execute();
                    }],
                    rTabs: ['$stateParams', '$permissions', 'rData', function($stateParams, $permissions, rData) {
                        var tabs = [{
                            heading: 'Details',
                            route: 'root.clients.viewer.staff.viewer.details'
                        }, {
                            heading: 'User',
                            route: 'root.clients.viewer.staff.viewer.user'
                        }];
                        if (!rData[0].AllPassengers) {
                            tabs.push({
                                heading: 'Passengers',
                                route: 'root.clients.viewer.staff.viewer.passengers'
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
                                return item.Firstname + ' ' + item.Surname;
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
            $stateProvider.state('root.clients.viewer.staff.viewer.details', {
                url: "/details",
                controller: 'ClientStaffItemDetailController',
                templateUrl: '/webapp/common/views/clients/staff/details/partial.html',
                resolve: {
                    rRoles: ['Model', function(Model) {
                        return Model.ClientStaffRole
                            .query()
                            .execute();
                    }]
                }
            })
            $stateProvider.state('root.clients.viewer.staff.viewer.passengers', {
                url: "/passengers",
                controller: 'ClientStaffItemPassengerController',
                templateUrl: '/webapp/common/views/clients/staff/passengers/partial.html'
                    // ,
                    // resolve: {
                    //     rPassengers: ['Model', '$stateParams', function(Model, $stateParams) {
                    //         return Model.Passenger.query()
                    //             .filter("ClientId eq guid'" + $stateParams.Id + "'")
                    //             .execute()
                    //     }]
                    // }
            });
            $stateProvider.state('root.clients.viewer.staff.viewer.user', {
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
        }

        if ($permissions.test('clients', 'W')) {
            $stateProvider.state('root.clients.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        controller: 'ClientItemCreateController',
                        templateUrl: '/webapp/management/clients/item/client-item-info.partial.html',
                        resolve: {
                            'rClientTypes': ['LookupCache', 'Model', function(LookupCache, Model) {
                                if (LookupCache.ClientType && LookupCache.ClientType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                                    return LookupCache.ClientType;
                                } else {
                                    return Model.ClientType
                                        .query()
                                        .execute()
                                        .then(function(data) {
                                            LookupCache.ClientType = data;
                                            LookupCache.ClientType.$updated = new moment();
                                            return LookupCache.ClientType;
                                        });
                                }
                            }],
                            'rClientTags': ['Model', function(Model) {
                                return Model.Tag
                                    .query()
                                    .execute()
                                    .then(function(data) {
                                        return data.filter(function(item) {
                                            return item.EntityType.indexOf("Client") != -1;
                                        });
                                    });
                            }],
                            'rCurrencies': ['Model', function(Model) {
                                return Model.Currency
                                    .query()
                                    .execute();
                            }],
                            rStaff: ['Model', '$stateParams', function (Model, $stateParams) {
                                return Model.Staff
                                    .query()
                                    .select('Id,Firstname,Surname')
                                    .parseAs(function (i) {
                                        return {
                                            Id: i.Id,
                                            Name: i.Firstname + ' ' + i.Surname
                                        }
                                    })
                                    .execute();
                            }],
                        }
                    }
                }
            });
        }

        if ($permissions.test('clients.pricingmodels')) {
            $stateProvider.state('root.clients.pricingmodels', {
                url: '/pricingmodels',
                viewerType: 'Client',
                permission: 'Clients - Pricing Models',
                resolve: {
                    rPricingModels: ['Model',
                        function(Model) {
                            return Model.PricingModel
                                .query()
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rData: ['Model', function(Model) {
                        return Model.Client
                            .query()
                            .include("ClientType")
                            .trackingEnabled()
                            .execute().then(function(data) {
                                return data;
                            });
                    }]
                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/clients/pricingmodels/model-assignments.partial.html',
                        controller: 'PricingModelAssignmentsController'
                    }
                }
            });
        }

        if ($permissions.test('clients.profitability')) {
            $stateProvider.state('root.clients.profitability', {
                url: '/profitability',
                viewerType: 'Client',
                permission: 'Clients - Profitability',
                resolve: {

                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/clients/profitability/profitability.partial.html',
                        controller: 'ClientProfitabilityController'
                    }
                }
            });
        }


        var subMenus = [{
            title: 'All',
            state: 'root.clients.cards',
            icon: 'icon-user-tie'
        }];

        if ($permissions.test('clients.pricingmodels')) {
            subMenus.push({
                title: 'Pricing Assignments',
                state: 'root.clients.pricingmodels',
                icon: 'icon-coins'
            });
        }

        if ($permissions.test('clients.profitability')) {
            subMenus.push({
                title: 'Profitability',
                state: 'root.clients.profitability',
                icon: 'icon-coins'
            });
        }

        MenuServiceProvider.registerMenuItem({
            //state: 'root.clients.cards',
            icon: 'domain',
            title: 'Clients',
            subMenus: subMenus.filter(function(s) {
                return s.state.substring(5); //$permissions.test(s.state.substring(5));
            })
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {}
}(angular))