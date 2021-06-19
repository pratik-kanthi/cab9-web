(function(window, angular) {
    var module = angular.module('cab9.drivers', []);

    module.config(moduleConfig);
    module.controller('DriversController', DriversController);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('drivers')) return;

        $urlRouterProvider.when('/drivers', '/drivers/cards');

        $stateProvider.state('root.drivers', {
            url: '/drivers',
            abstract: true,
            default: 'root.drivers.cards',
            hasHelp: '/webapp/management/drivers/all/brands-help.modal.html',
            permission: 'Drivers',
            resolve: {
                rMenu: [
                    function() {
                        return [];
                    }
                ],
                rId: function() {
                    return 'Id';
                },
                rData: ['Model',
                    function(Model) {
                        return Model.Driver
                            .query()
                            .include('DriverType')
                            .select('Id,Active,Firstname,Callsign,Surname,ImageUrl,Email,Mobile,DriverType,DriverTypeId,DriverType/Name,ScoreOverall')
                            .top(100)
                            .orderBy('Callsign')
                            .trackingEnabled()
                            .execute().then(function(data) {
                                data.pullMore = Model.Driver
                                    .query()
                                    .include('DriverType')
                                    .select('Id,Active,Firstname,Callsign,Surname,ImageUrl,Email,Mobile,DriverType,DriverTypeId,DriverType/Name,ScoreOverall')
                                    .trackingEnabled();
                                return data;
                            });
                    }
                ],
                rQuery: ['Model', function(Model) {
                    return Model.Driver
                        .query()
                        .include('DriverType,Cards')
                        .parseAs(Model.Driver);
                }],
                rServerSearch: function() {
                    return function(query, searchterms) {
                        if (searchterms.$) {
                            query.where("(substringof('" + searchterms.$ + "', Firstname) or substringof('" + searchterms.$ + "', Callsign) or substringof('" + searchterms.$ + "', Surname) or substringof('" + searchterms.$ + "', Mobile) or substringof('" + searchterms.$ + "', DriverType/Name))")
                        }
                        return query.clone();
                    }
                }
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                    controller: 'DriversController'
                },
                'options-area@root.drivers': {
                    templateUrl: '/webapp/management/drivers/all/drivers-module-options.partial.html',
                    controller: 'DriversModuleOptionsController'
                },
                'stats-area@root.drivers': {
                    templateUrl: '/webapp/management/drivers/all/drivers-module-stats.partial.html',
                    controller: 'DriversModuleStatsController'
                }
            }
        });

        if ($permissions.test('drivers.earnings')) {
            $stateProvider.state('root.drivers.earnings', {
                url: '/earnings',
                permission: 'Drivers - Earnings',
                resolve: {},
                showTimeControl: true,
                views: {
                    'content-wrapper@root': {
                        controller: 'DriverEstimateController',
                        templateUrl: '/webapp/management/drivers/estimates/template.html',
                    }
                }
            });
        }
        
        if ($permissions.test('drivers.expenses')) {
            $stateProvider.state('root.drivers.expenses', {
                url: '/expenses',
                permission: 'Drivers - Expenses',
                resolve: {},
                showTimeControl: true,
                views: {
                    'content-wrapper@root': {
                        controller: 'DriverExpenseController',
                        templateUrl: '/webapp/management/drivers/expenses/template.html',
                    }
                }
            });
        }

        if ($permissions.test('drivers.documents')) {
            $stateProvider.state('root.drivers.documents', {
                url: '/documents',
                permission: "Drivers - Documents",
                resolve: {
                    rDriverDocuments: ['$http', '$config', function ($http, $config) {
                        return $http.get($config.API_ENDPOINT + 'api/docs/expired');
                    }],
                    rDocumentTypes: ['Model', function (Model) {
                        return Model.DocumentType.query().execute();
                    }]
                },
                views: {
                    'content-wrapper@root': {
                        controller: ['$scope', 'rDriverDocuments', 'rDocumentTypes', '$timeout', 'CSV', function ($scope, rDriverDocuments, rDocumentTypes, $timeout, CSV) {
                            $scope.drivers = rDriverDocuments.data;
                            $scope.documentTypes = rDocumentTypes;
                            $scope.formatUrl = formatUrl;
                            $scope.today = new moment().startOf('day');
                            $scope.warning = new moment().subtract(1, 'month').startOf('day');
                            $scope.searchTerm = {};
                            $scope.toggleSearch = toggleSearch;
                            $scope.exportData = exportData;

                            function exportData() {
                                //var _drivers = angular.copy($scope.drivers);
                                CSV.download($scope.drivers.map(function (item) {
                                    return {
                                        Callsign: item.Callsign,
                                        Name: item.Firstname + " " + item.Surname,
                                        Email: item.Email,
                                        Active: item.Active ? 'Yes' : 'No',
                                        InactiveReason: item.InactiveReason,
                                        DrivingLicense: formatDate(item.Docs['75bb45ff-d712-e611-80c8-141877289421']),
                                        PCOLicense: formatDate(item.Docs['8fd1aee6-bfc9-4086-9eb1-9753a9d8b130']),
                                        NationalInsurance: formatDate(item.Docs['1129bff7-d712-e611-80c8-141877289421']),
                                        VehicleRegistration: item.Vehicle.Registration ? item.Vehicle.Registration : 'NA',
                                        VehicleDescription: item.Vehicle ? ((item.Vehicle.Colour ? item.Vehicle.Colour : "") + " " + (item.Vehicle.Make ? item.Vehicle.Make : "") + " " + (item.Vehicle.Model ? item.Vehicle.Model : "")) : 'NA',
                                        V5Registration: formatDate(item.Docs['2422ff28-8cd5-463a-8c62-1c864ddeeaf3']),
                                        MOTCertificate: formatDate(item.Docs['2e846662-e86b-e611-80ca-14187728d133']),
                                        VehiclePCOLicense: formatDate(item.Docs['44a72205-eb55-4021-9b00-acdaf653b40a']),
                                        Insurance: formatDate(item.Docs['3bd9cc4f-6383-4dc4-91e1-bfc8808af0c3']),
                                    };
                                }), "DriverDocuments");
                            }

                            function formatDate(doc) {
                                if (doc[0] && doc[0].ExpiryDate)
                                    return moment(doc[0].ExpiryDate).format('DD/MM/YYYY');
                                else
                                    return 'Missing';
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

                            function formatUrl(ImageUrl, text) {
                                if (ImageUrl) {
                                    if (ImageUrl.slice(0, 4) == 'http') {
                                        return ImageUrl;
                                    } else {
                                        return $config.RESOURCE_ENDPOINT + ImageUrl;
                                    }
                                } else {
                                    return $config.API_ENDPOINT + 'api/imagegen?text=' + text;
                                }
                            }
                        }],
                        templateUrl: '/webapp/management/drivers/documents/template.html',
                    }
                }
            });
        }

        $stateProvider.state('root.drivers.cards', {
            url: '/cards',
            resolve: {
                rAccessors: ['$config',
                    function($config) {
                        return {
                            Id: function (item) {
                                if (!item) return;
                                return item.Id;
                            },
                            Title: function (item) {
                                if (!item) return;
                                var title = '';
                                title += item.Callsign;
                                return title;
                            },
                            SubTitle: function (item) {
                                if (!item) return;
                                var subtitle = item.Firstname + ' ' + item.Surname;
                                return subtitle;
                            },
                            LogoUrl: function (item) {
                                if (!item) return;
                                return item._ImageUrl;
                            },
                            Score: function (item) {
                                if (!item) return;
                                return item.ScoreOverall;
                            },
                            Group: function (item) {
                                if (!item) return;
                                return item.DriverType.Name
                            }
                        };
                    }
                ],
                rNavTo: function() {
                    return 'root.drivers.viewer.dashboard';
                }
            },
            views: {
                'view-area@root.drivers': {
                    templateUrl: '/e9_components/layouts/module/module-cards.partial.html',
                    controller: 'ModuleCardsController'
                }
            }
        });

        $stateProvider.state('root.drivers.table', {
            url: '/table',
            resolve: {
                rNavTo: function() {
                    return 'root.drivers.viewer.dashboard';
                },
                rSchema: function() {
                    return 'Driver';
                },
                rDriverTypes: ['Model', function(Model) {
                    return Model.DriverType
                        .query()
                        .execute();
                }],
                rColumns: function() {
                    return null;
                }
            },
            views: {
                'options-area@root.drivers': {
                    templateUrl: '/webapp/management/drivers/all/drivers-module-table-options.partial.html',
                    controller: 'DriversModuleOptionsController'
                },
                'view-area@root.drivers': {
                    templateUrl: '/webapp/management/drivers/all/driver-paged-table.partial.html',
                    controller: 'DriverPagedTableController'
                }
            }
        });

        if ($permissions.test('drivers.viewer')) {
            $stateProvider.state('root.drivers.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.drivers.viewer.dashboard',
                viewerType: 'Driver',
                permission: 'View Driver',
                resolve: {
                    rTabs: ['$stateParams',
                        function($stateParams) {
                            var tabs = [{
                                heading: 'Dashboard',
                                route: 'root.drivers.viewer.dashboard',
                                params: {
                                    driverId: $stateParams.Id
                                }
                            }];

                            tabs.push({
                                heading: 'Info',
                                route: 'root.drivers.viewer.info',
                                params: {
                                    driverId: $stateParams.Id
                                }
                            });

                            if ($permissions.test('drivers.viewer.bookings')) {
                                tabs.push({
                                    heading: 'Bookings',
                                    route: 'root.drivers.viewer.bookings',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }

                            if ($permissions.test('drivers.viewer.documents')) {
                                tabs.push({
                                    heading: 'Documents',
                                    route: 'root.drivers.viewer.documents',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }

                            if ($permissions.test('drivers.viewer.vehicles')) {
                                tabs.push({
                                    heading: 'Vehicles',
                                    route: 'root.drivers.viewer.vehicles',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }
                            if ($permissions.test('drivers.viewer.payments')) {
                                tabs.push({
                                    heading: 'Payments',
                                    route: 'root.drivers.viewer.payments',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }
                            if ($permissions.test('drivers.viewer.fixed')) {
                                tabs.push({
                                    heading: 'Fixed Rates',
                                    route: 'root.drivers.viewer.fixed',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }
                            if ($permissions.test('drivers.viewer.adjustments')) {
                                tabs.push({
                                    heading: 'Adjustments',
                                    route: 'root.drivers.viewer.adjustments',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }
                            if ($permissions.test('drivers.viewer.notes')) {
                                tabs.push({
                                    heading: 'notes',
                                    route: 'root.drivers.viewer.notes',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }

                            if ($permissions.test('drivers.viewer.user')) {
                                tabs.push({
                                    heading: 'User',
                                    route: 'root.drivers.viewer.user',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }

                            if ($permissions.test('drivers.viewer.history')) {
                                tabs.push({
                                    heading: 'History',
                                    route: 'root.drivers.viewer.history',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                })
                            }

                            if ($permissions.test('drivers.viewer.creditcards')) {
                                tabs.push({
                                    heading: 'Credit cards',
                                    route: 'root.drivers.viewer.creditcards.cards',
                                    params: {
                                        driverId: $stateParams.Id
                                    }
                                });
                            }
                            return tabs;
                        }
                    ],
                    rData: ['Model', '$stateParams',
                        function(Model, $stateParams) {
                            return Model.Driver
                                .query()
                                .where('Id', '==', "guid'" + $stateParams.Id + "'")
                                .include('DriverType,DefaultDriverPaymentModel, Tags')
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                },
                                Title: function(item) {
                                    return item._Fullname;
                                },
                                SubTitle: function(item) {
                                    return item.Callsign;
                                },
                                LogoUrl: function(item) {
                                    return item._ImageUrl;
                                }
                            };
                        }
                    ]
                },
                views: {
                    'content-wrapper@root': {
                        controller: 'ModuleItemViewController',
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                    }
                }
            });

            $stateProvider.state('root.drivers.viewer.dashboard', {
                url: '/dashboard',
                viewerType: 'Driver',
                templateUrl: '/webapp/management/drivers/item/driver-item-dashboard.partial.html',
                controller: 'DriverItemDashboardController'
            });

            if ($permissions.test('drivers.viewer.history')) {
                $stateProvider.state('root.drivers.viewer.history', {
                    url: '/history',
                    viewerType: 'Driver',
                    permission: 'Driver - History',
                    templateUrl: '/webapp/management/drivers/item/driver-item-history.partial.html',
                    resolve: {
                        rHistory: ['Model', '$stateParams',
                            function (Model, $stateParams) {
                                return Model.AuditRecord
                                    .query()
                                    .include('Properties')
                                    .include('User')
                                    .trackingEnabled()
                                    .where('EntityId', 'eq', "guid'" + $stateParams.Id + "'")
                                    .where('EntityType', 'eq', "'Driver'")
                                    .orderBy('Timestamp desc')
                                    .execute();
                            }
                        ],
                    },
                    controller: ['$scope', 'rHistory', 'rData', function ($scope, rHistory, rData) {
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

                        $scope.getImage = function (path) {
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
                        angular.forEach(rHistory, function (x) {
                            var date = moment(x.Timestamp).format('DD MMM YYYY');
                            if (!$scope.history[date]) {
                                $scope.history[date] = [];
                            }
                            $scope.history[date].push(x);
                        });
                    }]
                });
            }

            if ($permissions.test('drivers.viewer.user')) {
                $stateProvider.state('root.drivers.viewer.user', {
                    url: '/user',
                    viewerType: 'Driver',
                    permission: 'Driver - User',
                    templateUrl: '/webapp/common/views/drivers/user/partial.html',
                    controller: 'DriverUserController',
                    resolve: {
                        rUser: ['$http', '$stateParams', '$config', '$q', function ($http, $stateParams, $config, $q) {
                            var deferred = $q.defer();
                            $http.get($config.API_ENDPOINT + "api/account/UserForOwner?ownerType=DriverId&OwnerId=" + $stateParams.Id).then(function (response) {
                                deferred.resolve(response.data);
                            }, function (err) {
                                deferred.resolve({
                                    Message: "User Not Found"
                                });
                            });
                            return deferred.promise;
                        }]
                    }
                });
            }

            if ($permissions.test('drivers.viewer.bookings')) {
                $stateProvider.state('root.drivers.viewer.bookings', {
                    url: '/bookings',
                    viewerType: 'Driver',
                    permission: 'Driver - Bookings',
                    controller: 'DriverBookingsController',
                    templateUrl: '/webapp/common/views/bookings/partial.html',
                    resolve: {}
                });
            }

            if ($permissions.test('drivers.viewer.documents')) {
                $stateProvider.state('root.drivers.viewer.documents', {
                    url: '/documents',
                    viewerType: 'Driver',
                    permission: 'Driver - Documents',
                    controller: 'ModuleDocumentsController',
                    templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
                    resolve: {
                        rDocuments: ['$stateParams', 'Model', '$q',
                            function($stateParams, Model, $q) {
                                return Model.Document
                                    .query()
                                    .where("OwnerType eq 'Driver'")
                                    .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                    .include("DocumentType")
                                    .trackingEnabled()
                                    .execute();
                            }
                        ],
                        rConfig: ['$stateParams',
                            function($stateParams) {
                                return {
                                    type: "Driver",
                                    id: $stateParams.Id
                                };
                            }
                        ]
                    }
                });
            }

            if ($permissions.test('drivers.viewer.payments')) {
                $stateProvider.state('root.drivers.viewer.payments', {
                    url: '/payments',
                    viewerType: 'Payments',
                    permission: 'Driver - Payments',
                    controller: 'DriverPaymentsController',
                    templateUrl: '/webapp/common/views/drivers/payments/partial.html'
                })
            }

            if ($permissions.test('drivers.viewer.adjustments')) {
                $stateProvider.state('root.drivers.viewer.adjustments', {
                    url: '/adjustments',
                    viewerType: 'Adjustments',
                    permission: 'Driver - Adjustments',
                    controller: 'DriverItemAdjustmentsController',
                    templateUrl: '/webapp/common/views/drivers/adjustments/partial.html',
                    resolve: {
                        rAdjustments: ['$stateParams', 'Model', '$q', function($stateParams, Model, $q) {
                            return Model.DriverAdjustment
                                .query()
                                .include('Tax')
                                .where("DriverId eq guid'" + $stateParams.Id + "'")
                                .execute();
                        }],
                        rRecurring: function() {
                            return false
                        }
                    }
                })
            }

            if ($permissions.test('drivers.viewer.fixed')) {
                $stateProvider.state('root.drivers.viewer.fixed', {
                    url: '/fixed',
                    viewerType: 'Fixed Rates',
                    permission: 'Driver - Fixed Rates',
                    controller: 'DriverItemFixedRatesController',
                    templateUrl: '/webapp/management/drivers/item/fixed/partial.html',
                    resolve: {
                        rFixedCount: ['Model', '$stateParams',
                        function(Model, $stateParams) {
                            return Model.DriverFixed.query()
                                .select('Id')
                                .parseAs(function(data) {
                                    this.Id = data.Id;
                                })
                                .where('DriverId', 'eq', "guid'" + $stateParams.Id + "'")
                                .execute()
                        }
                        ],
                        rFixeds: ['Model', '$stateParams',
                            function(Model, $stateParams) {
                                return Model.DriverFixed.query()
                                    .include('VehicleTypes,From,To')
                                    .where('DriverId', 'eq', "guid'" + $stateParams.Id + "'")
                                    .top(10)
                                    // .orderBy('CreationTime desc')
                                    .trackingEnabled()
                                    .execute();
                            }
                        ],
                        rZones: ['Model',
                            function(Model) {
                                return Model.Zone.query().execute();
                            }
                        ],
                        rVehicleTypes: ['Model',
                            function(Model) {
                                return Model.VehicleType.query().trackingEnabled().execute();
                            }
                        ]
                    }
                })
            }

            if ($permissions.test('drivers.viewer.notes')) {
                $stateProvider.state('root.drivers.viewer.notes', {
                    url: '/notes',
                    viewerType: 'Notes',
                    permission: 'Driver - Notes',
                    controller: 'DriverItemNotesController',
                    templateUrl: '/webapp/management/drivers/item/driver-item-notes.partial.html',
                    resolve: {
                        rNotes: ['$stateParams', 'Model', '$q',
                            function($stateParams, Model, $q) {
                                return Model.Note
                                    .query()
                                    .where("OwnerType eq 'DRIVER'")
                                    .where("OwnerId eq guid'" + $stateParams.Id + "'")
                                    .trackingEnabled()
                                    .execute();
                            }
                        ],
                        rStaffs: ['Model',
                            function(Model) {
                                return Model.Staff
                                    .query()
                                    .select('Id, Firstname, Surname')
                                    .parseAs(function(item) {
                                        this.Name = item.Firstname + ' ' + item.Surname;
                                        this.Id = item.Id
                                    })
                                    .execute();
                            }
                        ],
                        rUsers: ['Model',
                            function(Model) {
                                return Model.User
                                    .query()
                                    .include('Claims')
                                    .execute();
                            }
                        ]
                    }
                });
            }

            if ($permissions.test('drivers.viewer.vehicles')) {
                $stateProvider.state('root.drivers.viewer.vehicles', {
                    url: '/vehicles',
                    viewerType: 'Driver',
                    permission: 'Driver - Vehicles',
                    resolve: {
                        rData: ['Model', '$stateParams', function(Model, $stateParams) {
                            return Model.Vehicle
                                .query()
                                .where("DriverId eq guid'" + $stateParams.Id + "'")
                                .include('Type')
                                .include('Class')
                                .include('Driver')
                                .execute();
                        }],
                        rAccessors: ['$config', function($config) {
                            return {
                                Id: function(item) {
                                    return item.Id;
                                },
                                Title: function(item) {
                                    var title = '';
                                    title += item.Colour + ' ' + item.Make + ' ' + item.Model;
                                    return title;
                                },
                                SubTitle: function(item) {
                                    if (item.Driver) {
                                        var subtitle = item.Driver.Firstname + ' ' + item.Driver.Surname
                                    } else {
                                        var subtitle = "Company Car"
                                    }
                                    return subtitle;
                                },
                                LogoUrl: function(item) {
                                    return item._ImageUrl
                                },
                                Group: function(item) {
                                    return item.Type.Name
                                },
                                Score: function(item) {
                                    return item.ScoreOverall;
                                }
                            };
                        }],
                        rNavTo: function() {
                            return 'root.vehicles.viewer.dashboard';
                        }
                    },
                    views: {
                        'options-area@root.drivers.viewer': {
                            templateUrl: '/webapp/management/drivers/item/driver-item-vehicles.partial.html'
                        },
                        '@root.drivers.viewer': {
                            templateUrl: '/webapp/common/views/numplate/module-number-plate-secondary.partial.html',
                            controller: 'ModuleNumPlateSecondaryController'
                        }
                    }
                })
            }

            $stateProvider.state('root.drivers.viewer.info', {
                url: '/info',
                viewerType: 'Driver',
                templateUrl: '/webapp/management/drivers/item/driver-item-info.partial.html',
                controller: 'DriverItemInfoController',
                resolve: {
                    'rDriverTypes': ['LookupCache', 'Model',
                        function(LookupCache, Model) {
                            if (LookupCache.DriverType && LookupCache.DriverType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                                return LookupCache.DriverType;
                            } else {
                                return Model.DriverType
                                    .query()
                                    .execute()
                                    .then(function(data) {
                                        LookupCache.DriverType = data;
                                        LookupCache.DriverType.$updated = new moment();
                                        return LookupCache.DriverType;
                                    });
                            }
                        }
                    ],
                    'rTags': ['Model',
                        function(Model) {
                            return Model.Tag
                                .query()
                                .execute()
                                .then(function(data) {
                                    return data.filter(function(item) {
                                        return item.EntityType.indexOf("Driver") != -1;
                                    });
                                });
                        }
                    ],
                    'rVehicles': ['Model',
                        function(Model) {
                            return Model.Vehicle
                                .query()
                                .select('Id, Make, Model, Colour, Registration')
                                .parseAs(function(item) {
                                    this.Id = item.Id;
                                    this.Name = item.Registration + " " + item.Colour + " " + item.Make + " " + item.Model;
                                })
                                .execute();
                        }
                    ],
                    'rPaymentModels': ['Model',
                        function(Model) {
                            return Model.DriverPaymentModel
                                .query()
                                .select('Id, Name')
                                .parseAs(function(item) {
                                    this.Id = item.Id;
                                    this.Name = item.Name
                                })
                                .execute();
                        }
                    ]
                }
            });
        }

        var subMenus = [{
            title: 'All',
            state: 'root.drivers.cards',
            icon: 'icon-user-tie'
        }];

        if ($permissions.test('drivers.earnings')) {
            subMenus.push({
                title: 'Driver Earnings',
                state: 'root.drivers.earnings',
                icon: 'icon-user-tie'
            });
        }

        //if ($permissions.test('drivers.Expenses')) {
        if ($permissions.test('drivers.expenses')) {
            subMenus.push({
                title: 'Driver Expenses',
                state: 'root.drivers.expenses',
                icon: 'icon-user-tie'
            });
        }

        if ($permissions.test('drivers.paymentmodels')) {
            subMenus.push({
                title: 'Payment Assignments',
                state: 'root.drivers.paymentmodels',
                icon: 'icon-coins'
            });
        }

        if ($permissions.test('drivers.documents')) {
            subMenus.push({
                title: 'Document Expiration',
                state: 'root.drivers.documents',
                icon: 'icon-coins'
            });
        }

        if ($permissions.test('drivers.shifts')) {
            subMenus.push({
                title: 'Driver Shifts',
                state: 'root.drivers.shifts',
                icon: 'icon-format-line-spacing'
            });
        }

        MenuServiceProvider.registerMenuItem({
            icon: 'person_pin',
            title: 'Drivers',
            subMenus: subMenus.filter(function (s) {
                return s.state.substring(5); //$permissions.test(s.state.substring(5));
            })
        });

        if ($permissions.test('drivers', 'W')) {
            $stateProvider.state('root.drivers.create', {
                url: '/create',
                views: {
                    'content-wrapper@root': {
                        controller: 'DriverItemCreateController',
                        templateUrl: '/webapp/management/drivers/item/driver-item-info.partial.html',
                        resolve: {
                            'rDriverTypes': ['LookupCache', 'Model',
                                function(LookupCache, Model) {
                                    if (LookupCache.DriverType && LookupCache.DriverType.$updated.isAfter(new moment().subtract(10, 'minutes'))) {
                                        return LookupCache.DriverType;
                                    } else {
                                        return Model.DriverType
                                            .query()
                                            .execute()
                                            .then(function(data) {
                                                LookupCache.DriverType = data;
                                                LookupCache.DriverType.$updated = new moment();
                                                return LookupCache.DriverType;
                                            });
                                    }
                                }
                            ],
                            'rDriverTags': ['Model',
                                function(Model) {
                                    return Model.Tag
                                        .query()
                                        .execute()
                                        .then(function(data) {
                                            return data.filter(function(item) {
                                                return item.EntityType.indexOf("Driver") != -1;
                                            });
                                        });
                                }
                            ],
                            'rPaymentModels': ['Model',
                                function(Model) {
                                    return Model.DriverPaymentModel
                                        .query()
                                        .select('Id, Name')
                                        .parseAs(function(item) {
                                            this.Id = item.Id;
                                            this.Name = item.Name
                                        })
                                        .execute();
                                }
                            ]
                        }
                    }
                }
            });
        }

        if ($permissions.test('drivers.shifts')) {
            $stateProvider.state('root.drivers.shifts', {
                url: '/shifts',
                permission: 'Drivers - Shifts',
                views: {
                    'content-wrapper@root': {
                        controller: 'DriverShiftsController',
                        templateUrl: '/webapp/management/drivers/shifts/partial.html',
                    }
                }
            });
        }

        if ($permissions.test('drivers.paymentmodels')) {
            $stateProvider.state('root.drivers.paymentmodels', {
                url: '/paymentmodels',
                viewerType: 'Driver',
                permission: 'Drivers - Payment Models',
                resolve: {
                    rPaymentModels: ['Model',
                        function(Model) {
                            return Model.DriverPaymentModel
                                .query()
                                .trackingEnabled()
                                .execute();
                        }
                    ]
                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/drivers/paymentmodels/model-assignments.partial.html',
                        controller: 'PaymentModelAssignmentsController'
                    }
                }
            });
        }

        if ($permissions.test('drivers.viewer.creditcards')) {
            $stateProvider.state('root.drivers.viewer.creditcards', {
                url: '/creditcards',
                viewerType: 'CreditCard',
                default: 'root.drivers.viewer.creditcards.cards',
                permission: 'Drivers - Credit Cards',
                templateUrl: '/webapp/management/drivers/item/creditcards/partial.html',
                controller: ['$scope', 'rTabs', function($scope, rTabs) {
                    $scope.tabDefs = rTabs;
                }],
                resolve: {
                    rTabs: [
                        function() {
                            return [{
                                heading: 'Credit Cards',
                                route: 'root.drivers.viewer.creditcards.cards'
                            }, {
                                heading: 'Transactions',
                                route: 'root.drivers.viewer.creditcards.transactions'
                            }]
                        }
                    ]
                }
            });
            $stateProvider.state('root.drivers.viewer.creditcards.cards', {
                url: '/cards',
                templateUrl: '/webapp/common/views/clients/creditcards/cards/partial.html',
                controller: 'CreditCardsCardsController',
                resolve: {
                    rCards: ['$http', 'Model', '$stateParams', function($http, Model, $stateParams) {
                        return $http.get($config.API_ENDPOINT + 'api/Payments/getcardsfordriver?driverId=' + $stateParams.Id)
                            .then(function (response) {
                                return response.data;
                        });
                    }],
                    rClientId: ['$stateParams', function($stateParams) {
                        return null;
                    }],
                    rPassengerId: ['$stateParams', function($stateParams) {
                        return null;
                    }],
                    rDriverId: ['$stateParams', function($stateParams) {
                        return $stateParams.Id;
                    }]
                }
            });
            $stateProvider.state('root.drivers.viewer.creditcards.transactions', {
                url: '/transactions',
                templateUrl: '/webapp/management/drivers/item/transactions/partial.html',
                controller: 'DriverCreditCardsTransactionsController',
                resolve: {
                    rDriverId: ['$stateParams', function($stateParams) {
                        return $stateParams.Id;
                    }]
                }
            });
        }

    }

    function moduleRun() {

    }
    DriversController.$inject = ['$scope', 'rMenu', 'rData'];

    function DriversController($scope, rMenu, rData) {
        $scope.menu = rMenu;
        $scope.searchTerm = {};
        $scope.serverSearchTerm = {};

        angular.forEach(rMenu, function(menuItem) {
            menuItem.$html = _buildMenuItemTemplate(menuItem);
        })

        function _buildMenuItemTemplate(menuItem) {
            var template = '<a ui-sref="' + menuItem.state + '" style="color:white;width:100%;display:inline-block;">' +
                '<i class="' + menuItem.icon + '"></i>' +
                menuItem.title +
                '</a>';
            return template;
        }
    }
}(window, angular));