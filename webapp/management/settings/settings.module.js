(function (angular) {
    var module = angular.module('cab9.settings', []);

    module.config(moduleConfig);
    module.controller('SettingsController', SettingsController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('settings')) return;
        $stateProvider.state('root.settings', {
            url: '/settings',
            permission: 'Settings',
            resolve: {
                rMenu: [
                    function () {
                        return [];
                    }
                ]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/settings/settings.layout.html',
                    controller: 'SettingsController'
                }
            }
        });

        $urlRouterProvider.when('/settings', '/settings/pricingmodels');

        if ($permissions.test('settings.users')) {
            $stateProvider.state('root.settings.users', {
                url: '/users',
                permission: 'Settings - Users',
                searchText: 'users',
                searchName: 'Users',
                searchIcon: 'supervisor_account',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/users/users-config.partial.html',
                        controller: 'SettingsUsersController'
                    }
                }
            });
        }

        if ($permissions.test('settings.roles')) {
            $stateProvider.state('root.settings.roles', {
                url: '/roles',
                permission: 'Settings - Roles',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/roles/roles-config.partial.html',
                        controller: 'SettingsRolesController'
                    }
                },
                resolve: {
                    rRoles: ['Model',
                        function (Model) {
                            return Model.StaffRole
                                .query()
                                .parseAs(function (item) {
                                    item.$permissions = item.Permissions;
                                    try {
                                        item.Permissions = JSON.parse(item.$permissions || '[]');
                                    } catch (e) {
                                        item.Permissions = [];
                                    }
                                    return item;
                                })
                                .execute();
                        }
                    ],
                    rPermissions: ['$state',
                        function ($state) {
                            var permissions = [];
                            $state.get().forEach(function (state) {
                                if (state.permission) {
                                    permissions.push({
                                        Name: state.name.replace('root.', ''),
                                        DisplayName: state.permission,
                                        Rights: ['R', 'W', 'D']
                                    });
                                }
                            });
                            return permissions;
                        }
                    ]
                }
            });
        }

        $stateProvider.state('root.settings.profile', {
            url: '/password',
            views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/management/settings/profile/profile.partial.html',
                    controller: 'SettingsProfileController'
                },
                'profile-staff@root.settings.profile': {
                    templateUrl: '/webapp/management/staff/item/staff-item-profile.partial.html',
                    controller: 'StaffItemInfoController',
                    resolve: {
                        'rCustomRoles': ['Model',
                            function (Model) {
                                return Model.StaffRole
                                    .query()
                                    .trackingEnabled()
                                    .execute();
                            }
                        ],
                        'rData': ['Model', '$stateParams', 'Auth', '$q',
                            function (Model, $stateParams, Auth, $q) {
                                var defered = $q.defer();
                                Model.User
                                    .query()
                                    .where('Id', '==', "'" + Auth.getSession().UserId + "'")
                                    .include('Claims')
                                    .trackingEnabled()
                                    .execute()
                                    .then(function (user) {
                                        var staffClaim = user[0].Claims.filter(function (c) {
                                            return c.ClaimType == "StaffId"
                                        })[0];
                                        if (staffClaim) {
                                            Model.Staff
                                                .query()
                                                .where('Id', '==', "guid'" + staffClaim.ClaimValue + "'")
                                                .trackingEnabled()
                                                .execute()
                                                .then(function (staff) {
                                                    defered.resolve(staff);
                                                });
                                        }
                                    });
                                return defered.promise;
                            }
                        ],
                        rAccessors: ['$config',
                            function ($config) {
                                return {
                                    Id: function (item) {
                                        return item.Id;
                                    },
                                    Title: function (item) {
                                        return item._Fullname;
                                    },
                                    SubTitle: function (item) {
                                        return item.TownCity;
                                    },
                                    LogoUrl: function (item) {
                                        return item._ImageUrl;
                                    }
                                };
                            }
                        ]
                    }
                }
            }
        });

        if ($permissions.test('settings.company')) {
            $stateProvider.state('root.settings.company', {
                url: '/company',
                permission: 'Settings - Company',
                default: 'root.settings.company.basic',
                searchText: 'settings company',
                searchName: 'Company Settings',
                searchIcon: 'settings',
                resolve: {
                    rTabs: [
                        function () {
                            return [{
                                heading: 'Basic Settings',
                                route: 'root.settings.company.basic'
                            }, {
                                heading: 'Invoicing and Driver Payment',
                                route: 'root.settings.company.invoicing'
                            }, {
                                heading: 'Dispatch',
                                route: 'root.settings.company.dispatch'
                            }, {
                                heading: 'Company Setup',
                                route: 'root.settings.company.localisation'
                            }, {
                                heading: 'SMS Integration',
                                route: 'root.settings.company.sms'
                            }, {
                                heading: 'App Setup',
                                route: 'root.settings.company.app'
                            }, {
                                heading: 'Portal Setup',
                                route: 'root.settings.company.portal'
                            }, {
                                heading: 'Credit Card Settings',
                                route: 'root.settings.company.creditcards'
                            }, {
                                heading: 'Masked Number',
                                route: 'root.settings.company.maskednumber'
                            }, {
                                heading: 'FTP Details',
                                route: 'root.settings.company.ftpdetails'
                            }, {
                                heading: 'Web Booker Settings',
                                route: 'root.settings.company.webbooker'
                            },
                            {
                                heading: 'Auction Settings',
                                route: 'root.settings.company.auction-config'
                            },
                            {
                                heading: 'Auto Allocation Settings',
                                route: 'root.settings.company.auto-allocation'
                            },
                            {
                                heading: 'Flagdown Configuration',
                                route: 'root.settings.company.flagdown-config'
                            }
                            ]
                        }
                    ],
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .include("PricingModel")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rCardProviderDetails: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.CardPaymentProviderDetail
                                .query()
                                .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rPricingModels: ['Model',
                        function (Model) {
                            return Model.PricingModel
                                .query()
                                .execute();
                        }
                    ],
                    rCurrencies: ['Model',
                        function (Model) {
                            return Model.Currency
                                .query()
                                .execute();
                        }
                    ],
                    rPaymentModels: ['Model',
                        function (Model) {
                            return Model.DriverPaymentModel
                                .query()
                                .select('Id, Name')
                                .parseAs(function (item) {
                                    this.Id = item.Id;
                                    this.Name = item.Name
                                })
                                .execute();
                        }
                    ]
                },
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/company/company-settings.partial.html',
                        controller: ['$scope', 'rTabs', function ($scope, rTabs) {
                            $scope.tabDefs = rTabs;
                        }]
                    }
                }
            });

            $stateProvider.state('root.settings.company.basic', {
                url: '/basic',
                templateUrl: '/webapp/management/settings/company/basic/partial.html',
                controller: 'SettingsCompanyBasicController',
                resolve: {}
            });

            $stateProvider.state('root.settings.company.portal', {
                url: '/portal',
                templateUrl: '/webapp/management/settings/company/portal/partial.html',
                controller: 'SettingsCompanyPortalController',
                resolve: {
                    rSettings: ['Model', function (Model) {
                        return Model.ClientWebBookerSetting
                            .query()
                            .where('ClientId eq null')
                            .trackingEnabled()
                            .execute();
                    }]
                }
            })

            $stateProvider.state('root.settings.company.sms', {
                url: '/sms',
                templateUrl: '/webapp/management/settings/company/sms/partial.html',
                controller: ['$scope', 'rData', 'Model', function ($scope, rData, Model) {
                    $scope.item = rData[0] || new Model.SmsDetail();
                    $scope.viewMode = 'VIEW';
                    $scope.startEdit = startEdit;
                    $scope.cancelEdit = cancelEdit;
                    $scope.saveEdits = saveEdits;

                    function startEdit() {
                        $scope.viewMode = 'EDIT';
                    }

                    function cancelEdit() {
                        $scope.item.$rollback(false);
                        $scope.viewMode = 'VIEW';
                    }

                    function saveEdits() {
                        if ($scope.item.Id) {
                            $scope.item.$patch().success(function () {
                                $scope.viewMode = 'VIEW';
                            });
                        } else {
                            $scope.item.$save().success(function () {
                                $scope.viewMode = 'VIEW';
                            });
                        }
                    }
                }],
                resolve: {
                    rData: ['Model', function (Model) {
                        return Model.SmsDetail.query().trackingEnabled().execute();
                    }]
                }
            });

            $stateProvider.state('root.settings.company.invoicing', {
                url: '/invoicing',
                templateUrl: '/webapp/management/settings/company/invoicing/partial.html',
                controller: 'SettingsCompanyInvoicingController',
                searchText: 'invoice settings invoice',
                searchName: 'Invoice Settings',
                searchIcon: 'settings',
                resolve: {
                    rTaxes: ['Model', function (Model) {
                        return Model.Tax.query().execute();
                    }],
                    rCompanyPaymentSettings: ['Model', function (Model) {
                        return Model.CompanyPaymentSettings.query().trackingEnabled().execute();
                    }]
                }
            });

            $stateProvider.state('root.settings.company.localisation', {
                url: '/localisation',
                templateUrl: '/webapp/management/settings/company/localisation/partial.html',
                controller: 'SettingsCompanyLocalisationController',
                resolve: {}
            });
            

            $stateProvider.state('root.settings.company.auction-config', {
                url: '/auctionsettings',
                templateUrl: '/webapp/management/settings/company/auction-config/partial.html',
                controller: 'SettingsAuctionConfigController',
                resolve: {
                    rCompanyBiddingConfig: ['Model', function (Model) {
                        return Model.CompanyBiddingConfig.query().trackingEnabled().execute();
                    }],
                    rBiddingAutomationRules: ['$http', '$config', function ($http, $config) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + '/api/Bid/automation-rules'
                        }).then(function successCallback(response) {
                            return response.data;
                        }, function errorCallback(error) {
                            swal("Error", "There was some error trying to fetch the automation rules.", "error");
                        });
                    }],
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .where("Active eq true")
                            .select("Id, Name, AccountNo")
                            .orderBy('AccountNo')
                            .execute();
                    }],
                    rVehicleTypes: ['Model', function (Model) {
                        return Model.VehicleType.query().select("Id, Name").execute();
                    }],
                    rDriverTypes: ['Model', function (Model) {
                        return Model.DriverType.query().select("Id, TenantId, Name").execute();
                    }],
                    rExclusionRules: ['Model', function (Model) {
                        return Model.BiddingExclusionRule.query().trackingEnabled().execute();
                    }]
                }
            });

            $stateProvider.state('root.settings.company.auto-allocation', {
                url: '/autoallocation',
                templateUrl: '/webapp/management/settings/company/auto-allocation/partial.html',
                controller: 'SettingsAutoAllocationController',
                resolve: {
                    rAutoAllocationRules: ['$http', '$config', function ($http, $config) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + '/api/allocation-rules/get-rules'
                        }).then(function successCallback(response) {
                            return response.data;
                        }, function errorCallback(error) {
                            swal("Error", "There was some error trying to fetch the auto allocation rules.", "error");
                        });
                    }],
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .where("Active eq true")
                            .select("Id, Name, AccountNo")
                            .orderBy('AccountNo')
                            .execute();
                    }],
                    rVehicleTypes: ['Model', function (Model) {
                        return Model.VehicleType.query().select("Id, Name").execute();
                    }],
                    rDriverTypes: ['Model', function (Model) {
                        return Model.DriverType.query().select("Id, TenantId, Name").execute();
                    }],
                    rExclusionRules: ['Model', function (Model) {
                        return Model.BiddingExclusionRule.query().trackingEnabled().execute();
                    }]
                }
            });

            $stateProvider.state('root.settings.company.flagdown-config', {
                url: '/flagdownsettings',
                templateUrl: '/webapp/management/settings/company/flagdown-config/partial.html',
                controller: 'FlagDownConfigurationController',
                resolve: {
                    rCompanyFlagDownConfig: ['Model', function (Model) {
                        return Model.FlagDownConfiguration.query().trackingEnabled().execute();
                    }],
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .where("Active eq true")
                            .select("Id, Name, AccountNo")
                            .orderBy('AccountNo')
                            .execute();
                    }]
                }
            });

            $stateProvider.state('root.settings.company.creditcards', {
                url: '/creditcards',
                templateUrl: '/webapp/management/settings/company/creditcards/partial.html',
                controller: 'SettingsCompanyCreditCardsController',
                resolve: {

                }
            });

            $stateProvider.state('root.settings.company.maskednumber', {
                url: '/maskednumber',
                templateUrl: '/webapp/management/settings/company/maskednumber/partial.html',
                controller: 'SettingsMaskedNumberController',
                resolve: {
                    rMaskedNumberProviderDetail: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.MaskedNumberProviderDetail
                                .query()
                                .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.company.ftpdetails', {
                url: '/ftp-details',
                templateUrl: '/webapp/management/settings/company/ftpdetails/partial.html',
                controller: 'SettingsFTPDetailsController'
            });



            $stateProvider.state('root.settings.company.webbooker', {
                url: '/webbooker',
                templateUrl: '/webapp/management/settings/company/webbooker/partial.html',
                controller: 'SettingsWebBookerController',
                resolve: {
                    rAppConfigs: ['$http', 'Model', '$stateParams', 'Auth', function ($http, Model, $stateParams, Auth) {
                        return $http.get($config.API_ENDPOINT + 'api/appconfig?TenantId=' + Auth.getSession().TenantId).then(function (response) {
                            if (response.data.length > 0) {
                                return response.data.map(function (x) {
                                    return new Model.AppConfig(x);
                                });
                            }
                        });
                    }]
                }
            });

            $stateProvider.state('root.settings.company.app', {
                url: '/app',
                templateUrl: '/webapp/management/settings/company/app/partial.html',
                controller: 'SettingsMobileAppController',
                resolve: {}
            });

            $stateProvider.state('root.settings.company.dispatch', {
                url: '/dispatch',
                templateUrl: '/webapp/management/settings/company/dispatch/partial.html',
                controller: 'SettingsCompanyDispatchController',
                resolve: {}
            });
        }

        if ($permissions.test('settings.booking')) {
            $stateProvider.state('root.settings.booking', {
                url: '/booking',
                default: 'root.settings.booking.expenses',
                permission: 'Settings - Booking',
                resolve: {
                    rTabs: [
                        function () {
                            return [{
                                heading: 'Expenses',
                                route: 'root.settings.booking.expenses'
                            }, {
                                heading: 'Booking Form',
                                route: 'root.settings.booking.form'
                            }]
                        }
                    ],
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                },
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/booking/partial.html',
                        controller: ['$scope', 'rTabs', function ($scope, rTabs) {
                            $scope.tabDefs = rTabs;
                        }]
                    }
                }
            });

            $stateProvider.state('root.settings.booking.expenses', {
                url: '/expenses',
                templateUrl: '/webapp/management/settings/booking/expenses/partial.html',
                controller: 'SettingsBookingExpensesController',
                resolve: {
                    rExpenses: ['Model',
                        function (Model) {
                            return Model.BookingExpenseType
                                .query()
                                .include('Tax')
                                .execute();
                        }
                    ],
                }

            });

            $stateProvider.state('root.settings.booking.form', {
                url: '/booking-form',
                templateUrl: '/webapp/management/settings/booking/booking-form/partial.html',
                controller: 'SettingsBookingFormController'
            });
        }

        if ($permissions.test('settings.telephony')) {
            $stateProvider.state('root.settings.telephony', {
                url: '/telephony',
                permission: 'Settings - Telephony',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/telephony/partial.html',
                        controller: 'SettingsTelephonyController'
                    }
                },
                resolve: {
                    rIntegration: ['Model',
                        function (Model) {
                            return Model.TelephonyIntegration.query().execute();
                        }
                    ]
                }
            });
        }

        if ($permissions.test('settings.telephony')) {
            $stateProvider.state('root.settings.loyalty', {
                url: '/loyalty-configuration',
                permission: 'Settings - Loyalty System',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/loyalty/partial.html',
                        controller: 'LoyaltyConfigController'
                    }
                },
                resolve: {}
            });
        }

        if ($permissions.test('settings.googlemapsconfig')) {
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
                        function (Model) {
                            return Model.GoogleMapsConfig.query().execute();
                        }
                    ]
                }
            });
        }

        $urlRouterProvider.when('/settings/knownlocations', '/settings/knownlocations/cards');

        if ($permissions.test('settings.knownlocations')) {
            $stateProvider.state('root.settings.knownlocations', {
                url: '/knownlocations',
                default: 'root.settings.knownlocations.cards',
                permission: 'Settings - Known Locations',
                resolve: {
                    rData: ['Model',
                        function (Model) {
                            return Model.KnownLocation.query().include('KnownPickupPoints').execute();
                        }
                    ]
                },
                views: {
                    'settings-content@root.settings': {
                        // templateUrl: '/e9_components/layouts/module/module-base.layout.html',
                        templateUrl: '/webapp/management/settings/known-locations/known-locations.partial.html',
                        controller: ['$scope',
                            function ($scope) {
                                $scope.searchTerm = {};
                                $scope.serverSearchTerm = {};
                            }
                        ]
                    },
                    'options-area@root.settings.knownlocations': {
                        templateUrl: '/webapp/management/settings/known-locations/known-locations-options.partial.html',
                        controller: ['$scope',
                            function ($scope) {
                                $scope.toggleSearch = toggleSearch;

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
                            }
                        ]
                    }
                }
            });

            $stateProvider.state('root.settings.knownlocations.create', {
                url: '/create',
                resolve: {},
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/common/views/locations/create.partial.html',
                        controller: 'KnownLocationCreateController'
                    }
                }
            });

            $stateProvider.state('root.settings.knownlocations.cards', {
                url: '/cards',
                resolve: {
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                Id: function (item) {
                                    return item.Id;
                                },
                                Title: function (item) {
                                    return item.Name;
                                },
                                SubTitle: function (item) {
                                    return item.LocationType;
                                },
                                LogoUrl: function (item) {
                                    return item._ImageUrl;
                                },
                                Group: function (item) {
                                    return item.LocationType
                                }
                            };
                        }
                    ],
                    rNavTo: function () {
                        return 'root.settings.knownlocations.viewer.details';
                    }
                },
                views: {
                    'view-area@root.settings.knownlocations': {
                        templateUrl: '/e9_components/layouts/module/module-cards.partial.html',
                        controller: 'ModuleCardsController'
                    }
                }
            });

            $stateProvider.state('root.settings.knownlocations.table', {
                url: '/table',
                resolve: {
                    rNavTo: function () {
                        return 'root.settings.knownlocations.viewer.details';
                    },
                    rSchema: function () {
                        return 'KnownLocation';
                    },
                    rId: function () {
                        return 'Id';
                    },
                    rQuery: ['Model', function (Model) {
                        return Model.KnownLocation
                            .query()
                            .include('KnownPickupPoints')
                            // .select('Id,Name,AccountNo,ImageUrl,TownCity,ClientType/Name,ScoreOverall,Phone')
                            .parseAs(Model.KnownLocation);
                    }],
                    rServerSearch: function () {
                        return function (query, searchterms) {
                            if (searchterms.$) {
                                query.where("(substringof('" + searchterms.$ + "', Name) or substringof('" + searchterms.$ + "', StopSummary) or substringof('" + searchterms.$ + "', TownCity) or substringof('" + searchterms.$ + "', Area) or substringof('" + searchterms.$ + "', Address1) or substringof('" + searchterms.$ + "', Postcode))")
                            }
                            return query.clone();
                        }
                    }
                },
                views: {
                    'options-area@root.settings.knownlocations': {
                        templateUrl: '/webapp/management/settings/known-locations/known-locations-table-options.partial.html',
                        controller: ['$scope',
                            function ($scope) {
                                $scope.toggleSearch = toggleSearch;

                                function toggleSearch() {
                                    $scope.showSearch = !$scope.showSearch;
                                    if (!$scope.showSearch) {
                                        $scope.serverSearchTerm.$ = '';
                                    } else {
                                        setTimeout(function () {
                                            $('#searchTerm').focus()
                                        }, 500);
                                    }
                                }
                            }
                        ]
                    },
                    'view-area@root.settings.knownlocations': {
                        templateUrl: '/e9_components/layouts/module/module-paged-table.partial.html',
                        controller: 'ModulePagedTableController'
                    }
                }
            });

            $stateProvider.state('root.settings.knownlocations.viewer', {
                url: '/{Id:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}}',
                default: 'root.settings.knownlocations.viewer.details',
                viewerType: 'KnownLocation',
                resolve: {
                    rTabs: ['$stateParams',
                        function ($stateParams) {
                            var tabs = [{
                                heading: 'Details',
                                route: 'root.settings.knownlocations.viewer.details',
                                params: {
                                    locationId: $stateParams.Id
                                }
                            }];
                            tabs.push({
                                heading: 'Points',
                                route: 'root.settings.knownlocations.viewer.points',
                                params: {
                                    locationId: $stateParams.Id
                                }
                            });
                            return tabs;
                        }
                    ],
                    rData: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.KnownLocation
                                .query()
                                .include('KnownPickupPoints')
                                .trackingEnabled()
                                .where('Id', '==', "guid'" + $stateParams.Id + "'")
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                Id: function (item) {
                                    return item.Id;
                                },
                                Title: function (item) {
                                    return item.Name;
                                },
                                SubTitle: function (item) {
                                    return item.StopSummary;
                                },
                                LogoUrl: function (item) {
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
            $stateProvider.state('root.settings.knownlocations.viewer.details', {
                url: '/details',
                viewerType: 'KnownLocation',
                templateUrl: '/webapp/management/settings/known-locations/item/knownlocation-item-details.partial.html',
                controller: 'KnownLocationDetailsController'
            });
            $stateProvider.state('root.settings.knownlocations.viewer.points', {
                url: '/points',
                viewerType: 'KnownLocation',
                templateUrl: '/webapp/management/settings/known-locations/item/knownlocation-item-points.partial.html',
                controller: 'KnownLocationPointsController'
            });
        }

        if ($permissions.test('settings.email')) {
            $stateProvider.state('root.settings.email', {
                url: '/email',
                permission: 'Settings - Email',
                resolve: {
                    rTabs: ['$stateParams',
                        function ($stateParams) {
                            return [{
                                heading: 'Configuration',
                                route: 'root.settings.email.config'
                            }, {
                                heading: 'Templates',
                                route: 'root.settings.email.templates'
                            }];
                        }
                    ],
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rConfig: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.EmailConfig
                                .query()
                                .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                Title: function (item) {
                                    return "Email";
                                }
                            };
                        }
                    ]
                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                        controller: 'SettingsEmailController'
                    }
                }
            });

            $stateProvider.state('root.settings.email.config', {
                url: '/config',
                templateUrl: '/webapp/management/settings/email/email-config.partial.html',
                controller: 'SettingsEmailConfigController'
            });

            $stateProvider.state('root.settings.email.templates', {
                url: '/templates',
                templateUrl: '/webapp/management/settings/email/email-template.partial.html',
                controller: 'SettingsEmailTemplateController'
            });
        }

        if ($permissions.test('settings.pricingmodels')) {
            $stateProvider.state('root.settings.pricingmodels', {
                url: '/pricingmodels',
                permission: 'Settings - Pricing Models',
                resolve: {
                    rData: ['Model',
                        function (Model) {
                            return Model.PricingModel
                                .query()
                                .include("Zones")
                                .include("VehicleTypePricings")
                                .trackingEnabled()
                                .execute();
                        }
                    ]
                },
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/pricingmodels/pricing-models.partial.html',
                        controller: 'SettingsPricingModelsController'
                    }
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer', {
                url: '/{Id}',
                resolve: {
                    rTabs: ['$stateParams',
                        function ($stateParams) {
                            return [{
                                heading: 'Details',
                                route: 'root.settings.pricingmodels.viewer.details'
                            }, {
                                heading: 'Zones',
                                route: 'root.settings.pricingmodels.viewer.zones'
                            }, {
                                heading: 'Fixed',
                                route: 'root.settings.pricingmodels.viewer.fixed'
                            }, {
                                heading: 'Vehicles',
                                route: 'root.settings.pricingmodels.viewer.vehicles',
                            }, {
                                heading: 'Testing',
                                route: 'root.settings.pricingmodels.viewer.tester',
                            }, {
                                heading: 'Price List',
                                route: 'root.settings.pricingmodels.viewer.pricelist'
                            }, {
                                heading: 'Adjustments',
                                route: 'root.settings.pricingmodels.viewer.adjustments',
                            }, {
                                heading: 'History',
                                route: 'root.settings.pricingmodels.viewer.history',
                            }];
                        }
                    ],
                    rData: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.PricingModel
                                .query()
                                .include('Zones/Zone')
                                .include('CancellationRule')
                                .where("Id eq guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                Id: function (item) {
                                    return item.Id;
                                },
                                Title: function (item) {
                                    return item.Name;
                                }
                            };
                        }
                    ]
                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                        controller: 'SettingsPricingModelsViewerController'
                    }
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.details', {
                url: '/details',
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-details.partial.html',
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.zones', {
                url: '/zones',
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-zones.partial.html',
                controller: 'SettingsPricingModelsZonesController',
                resolve: {
                    rZones: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.ZoneInPricingModel.query()
                                .where('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rAllZones: ['Model',
                        function (Model) {
                            return Model.Zone.query().execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.history', {
                url: '/history',
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-history.partial.html',
                resolve: {
                    rHistory: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.AuditRecord
                                .query()
                                .include('Properties')
                                .include('User')
                                .trackingEnabled()
                                .where('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .orderBy('Timestamp desc')
                                .execute();
                        }
                    ],
                },
                controller: ['$scope', 'rHistory', 'rData', function ($scope, rHistory, rData) {
                    $scope.iconsIndex = {
                        "Modified": "assignment",
                    }

                    $scope.coloursIndex = {
                        "Modified": "orange-bg",
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

            $stateProvider.state('root.settings.pricingmodels.viewer.fixed', {
                url: '/fixed',
                templateUrl: '/webapp/management/settings/pricingmodels/fixed/partial.html',
                controller: 'SettingsPricingModelsFixedController',
                resolve: {
                    rFixedCount: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.PricingFixed.query()
                                .select('Id')
                                .parseAs(function (data) {
                                    this.Id = data.Id;
                                })
                                .where('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .execute()
                        }
                    ],
                    rFixeds: ['$http', 'Model', '$stateParams', function ($http, Model, $stateParams) {
                        return $http.get($config.API_ENDPOINT + 'api/PricingModels/FetchFixedDetails?pricingModelId=' + $stateParams.Id + '&count=50');
                    }],
                    rZones: ['Model',
                        function (Model) {
                            return Model.Zone.query().execute();
                        }
                    ],
                    rVehicleTypes: ['Model',
                        function (Model) {
                            return Model.VehicleType.query().execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.vehicles', {
                url: '/vehicles',
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-vehicles.partial.html',
                controller: 'SettingsPricingModelsVehiclesController',
                resolve: {
                    rVehiclePricings: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.PricingModelVehicleTypePricing.query()
                                .where('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rVehicleTypes: ['Model',
                        function (Model) {
                            return Model.VehicleType.query().execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.tester', {
                url: '/tester',
                templateUrl: '/webapp/management/settings/pricingmodels/pricing-models-tester.partial.html',
                controller: 'SettingsPricingModelsTesterController',
                resolve: {
                    rVehicleTypes: ['Model',
                        function (Model) {
                            return Model.VehicleType.query().execute();
                        }
                    ],
                    rZones: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.ZoneInPricingModel.query()
                                .include('Zone')
                                .where('PricingModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.pricelist', {
                url: '/pricelist',
                templateUrl: '/webapp/management/settings/pricingmodels/price-list/partial.html',
                controller: 'SettingsPriceListController'
            });

            $stateProvider.state('root.settings.pricingmodels.viewer.adjustments', {
                url: '/adjustments',
                controller: 'ClientPricingModelAdjustmentController',
                templateUrl: '/webapp/management/settings/pricingmodels/adjustments/partial.html',
                resolve: {
                    rAdjustments: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.ClientPricingModelAdjustment
                            .query()
                            .where("PricingModelId eq guid'" + $stateParams.Id + "'")
                            .include('Tax')
                            .execute()
                    }],
                    rRecurring: function () {
                        return true
                    }
                }
            });
        }

        if ($permissions.test('settings.dispatch')) {
            $stateProvider.state('root.settings.dispatch', {
                url: '/dispatch',
                permission: 'Settings - AutoDispatch',
                resolve: {
                    rTabs: ['$stateParams', function ($stateParams) {
                        return [{
                            heading: 'Details',
                            route: 'root.settings.dispatch.details'
                        }, {
                            heading: 'Testing',
                            route: 'root.settings.dispatch.testing'
                            }, {
                                heading: 'Live',
                                route: 'root.settings.dispatch.live'
                            }];
                    }],
                    rData: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.DispatchSettings
                                .query()
                                .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .select('Id,BaseLatitude,BaseLongitude,BaseZoom')
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                //Id: function (item) {
                                //    return item.Id;
                                //},
                                Title: function (item) {
                                    return "Dispatch";
                                }
                            };
                        }
                    ],
                    rClients: ['Model', function (Model) {
                        return Model.Client.query().select('Id,Name,ImageUrl').execute();
                    }],
                    rZones: ['Model', function (Model) {
                        return Model.Zone.query().execute();
                    }],
                    rOverrides: ['Model', function (Model) {
                        return Model.DispatchOverrides.query().include('Client').include('Zone').trackingEnabled().execute();
                    }]
                },
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/e9_components/layouts/module/module-item.layout.html',
                        controller: 'SettingsDispatchController'
                    }
                }
            });

            $stateProvider.state('root.settings.dispatch.details', {
                url: '/details',
                templateUrl: '/webapp/management/settings/dispatch/dispatch-details.partial.html',
                controller: 'SettingsDispatchDetailsController',
                resolve: {
                }
            });

            $stateProvider.state('root.settings.dispatch.testing', {
                url: '/testing',
                templateUrl: '/webapp/management/settings/dispatch/dispatch-tester.partial.html',
                controller: 'SettingsDispatchTesterController'
            });

            $stateProvider.state('root.settings.dispatch.live', {
                url: '/live',
                templateUrl: '/webapp/management/settings/dispatch/dispatch-live.partial.html',
                controller: 'SettingsDispatchLiveController'
            });
        }

        if ($permissions.test('settings.taxes')) {
            $stateProvider.state('root.settings.taxes', {
                url: '/taxes',
                permission: 'Settings - Taxes',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/taxes/table.partial.html',
                        controller: 'SettingsTaxesController'
                    }
                },
                resolve: {
                    rTaxes: ['Model',
                        function (Model) {
                            return Model.Tax
                                .query()
                                .include('TaxType')
                                .include('TaxComponents')
                                .execute();
                        }
                    ]
                }
            });
        }

        if ($permissions.test('settings.taxes', 'W')) {
            $stateProvider.state('root.settings.taxes.create', {
                url: '/create',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/taxes/viewer.partial.html',
                        controller: 'SettingsTaxCreateController'
                    }
                },
                resolve: {
                    rTaxTypes: ['Model',
                        function (Model) {
                            return Model.TaxType
                                .query()
                                .execute();
                        }
                    ]
                }
            });
        }

        if ($permissions.test('settings.payments')) {
            $stateProvider.state('root.settings.payments', {
                url: '/payments',
                permission: 'Settings - Payment Models',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/common/views/driverpayments/partial.html',
                        controller: 'DriverPaymentModelsController'
                    }
                },
                resolve: {
                    rPaymentModels: ['Model',
                        function (Model) {
                            return Model.DriverPaymentModel
                                .query()
                                .execute();
                        }
                    ]
                }
            });

            $stateProvider.state('root.settings.payments.viewer', {
                url: '/{Id}',
                default: 'root.settings.payments.viewer.details',
                resolve: {
                    rTabs: ['$stateParams',
                        function ($stateParams) {
                            return [{
                                heading: 'Details',
                                route: 'root.settings.payments.viewer.details'
                            }, {
                                heading: 'Bonus',
                                route: 'root.settings.payments.viewer.bonus'
                            }, {
                                heading: 'Adjustments',
                                route: 'root.settings.payments.viewer.adjustments'
                            }, {
                                heading: 'Fixed Rates',
                                route: 'root.settings.payments.viewer.fixed'
                            }];
                        }
                    ],
                    rData: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.DriverPaymentModel
                                .query()
                                .include('Overrides,Overrides/Client,Overrides/VehicleType')
                                .where("Id eq guid'" + $stateParams.Id + "'")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rVehicleTypes: ['Model',
                        function (Model) {
                            return Model.VehicleType
                                .query()
                                .execute();
                        }
                    ],
                    rAccessors: ['$config',
                        function ($config) {
                            return {
                                Id: function (item) {
                                    return item.Id;
                                },
                                Title: function (item) {
                                    return item.Name;
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
            $stateProvider.state('root.settings.payments.viewer.details', {
                url: '/details',
                controller: 'DriverPaymentModelDetailsController',
                templateUrl: '/webapp/common/views/driverpayments/details/partial.html',
            });
            $stateProvider.state('root.settings.payments.viewer.adjustments', {
                url: '/adjustments',
                controller: 'DriverPaymentModelAdjustmentController',
                templateUrl: '/webapp/common/views/drivers/adjustments/partial.html',
                resolve: {
                    rAdjustments: ['Model', '$stateParams', function (Model, $stateParams) {
                        return Model.DriverPaymentModelAdjustment
                            .query()
                            .where("DriverPaymentModelId eq guid'" + $stateParams.Id + "'")
                            .include('Tax')
                            .execute()
                    }],
                    rRecurring: function () {
                        return true
                    }
                }
            });

            $stateProvider.state('root.settings.payments.viewer.fixed', {
                url: '/fixed',
                controller: 'SettingsDriverPaymentFixedController',
                templateUrl: '/webapp/management/settings/driverpayments/fixed/partial.html',
                resolve: {
                    rFixeds: ['$http', 'Model', '$stateParams', function ($http, Model, $stateParams) {
                        return $http.get($config.API_ENDPOINT + 'api/DriverPayments/FetchDriverFixedDetails?driverPaymentModelId=' + $stateParams.Id + '&count=50').then(function (response) {
                            if (response.data.length > 0) {
                                return response.data.map(function (x) {
                                    return new Model.DriverPaymentModelFixed(x);
                                });
                            } else {
                                return [];
                            }
                        });
                    }],
                    rFixedCount: ['Model', '$stateParams',
                        function (Model, $stateParams) {
                            return Model.DriverPaymentModelFixed.query()
                                .select('Id')
                                .parseAs(function (data) {
                                    this.Id = data.Id;
                                })
                                .where('DriverPaymentModelId', 'eq', "guid'" + $stateParams.Id + "'")
                                .execute()
                        }
                    ],
                    rZones: ['Model',
                        function (Model) {
                            return Model.Zone.query().execute();
                        }
                    ],
                    rVehicleTypes: ['Model',
                        function (Model) {
                            return Model.VehicleType.query().trackingEnabled().execute();
                        }
                    ]
                }
            });


            $stateProvider.state('root.settings.payments.viewer.bonus', {
                url: '/bonus',
                controller: 'DriverPaymentModelBonusController',
                templateUrl: '/webapp/common/views/driverpayments/bonus/partial.html',
            });

        }

        if ($permissions.test('settings.specialrequirements')) {
            $stateProvider.state('root.settings.specialrequirements', {
                url: '/specialrequirements',
                permission: 'Settings - Special Requirements',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/specialrequirements/partial.html',
                        controller: 'SpecialRequirementsController'
                    }
                },
                resolve: {
                    rBRequirements: ['Model',
                        function (Model) {
                            return Model.BookingRequirement
                                .query()
                                .include('Bookings')
                                .trackingEnabled()
                                .execute();
                        }
                    ]
                }
            });
        }

        if ($permissions.test('settings.appsettings')) {
            $stateProvider.state('root.settings.appsettings', {
                url: '/appsettings',
                permission: 'Settings - App Settings',
                views: {
                    'settings-content@root.settings': {
                        templateUrl: '/webapp/management/settings/app-settings/partial.html',
                        controller: 'AppSettingsController'
                    }
                },
                resolve: {
                    rAppConfigs: ['$http', 'Model', '$stateParams', 'Auth', function ($http, Model, $stateParams, Auth) {
                        return $http.get($config.API_ENDPOINT + 'api/appconfig?TenantId=' + Auth.getSession().TenantId).then(function (response) {
                            if (response.data.length > 0) {
                                return response.data.map(function (x) {
                                    return new Model.AppConfig(x);
                                });
                            }
                        });
                    }]
                }
            });
        }

        if ($permissions.test('settings.zones')) {
            $stateProvider.state('root.settings.zones', {
                url: '/zones',
                permission: 'Settings - Zone Management',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/settings/zones/zone-management.partial.html',
                        controller: 'ZoneManagementController'
                    }
                },
                resolve: {
                    rZones: ['Model', function (Model) {
                        return Model.Zone.query().trackingEnabled().execute();
                    }]
                }
            });
        }

        if ($permissions.test('settings.tags')) {
            $stateProvider.state('root.settings.tags', {
                url: '/tags',
                permission: 'Settings - Tag Management',
                views: {
                    'content-wrapper@root': {
                        templateUrl: '/webapp/management/settings/tags/partial.html',
                        controller: 'TagManagementController'
                    }
                },
                resolve: {
                    rTags: ['Model', function (Model) {
                        return Model.Tag.query().trackingEnabled().execute();
                    }]
                }
            });
        }


        //#endregion
        var subMenus = [{
            title: 'Company',
            state: 'root.settings.company.basic',
            icon: 'icon-equalizer22'
        }, {
            title: 'Booking',
            state: 'root.settings.booking.expenses',
            icon: 'icon-equalizer22'
        }, {
            title: 'Telephony',
            state: 'root.settings.telephony',
            icon: 'icon-phone'
        }, {
            title: 'Loyalty',
            state: 'root.settings.loyalty',
            icon: 'icon-phone'
        }, {
            title: 'Zones',
            state: 'root.settings.zones',
            icon: 'icon-equalizer22'
        }, {
            title: 'Pricing',
            state: 'root.settings.pricingmodels',
            icon: 'icon-coins'
        }, {
            title: 'Driver Payment',
            state: 'root.settings.payments',
            icon: 'icon-coins'
        }, {
            title: 'VAT/Taxes',
            state: 'root.settings.taxes',
            icon: 'icon-coins'
        }, {
            title: 'Email Config',
            state: 'root.settings.email.config',
            icon: 'icon-envelope'
        }, {
            title: 'Profile Settings',
            allow: true,
            state: 'root.settings.profile',
            icon: 'icon-lock'
        }, {
            title: 'Users',
            state: 'root.settings.users',
            icon: 'icon-users'
        }, {
            title: 'System Roles',
            state: 'root.settings.roles',
            icon: 'icon-lock'
        }, {
            title: 'Known Locations',
            state: 'root.settings.knownlocations',
            icon: 'icon-lock'
        }, {
            title: 'Auto Dispatch',
            state: 'root.settings.dispatch.details',
            icon: 'icon-lock'
        },{
            title: 'Tags',
            state: 'root.settings.tags',
            icon: 'icon-lock'
        }, {
            title: 'Special Requirements',
            state: 'root.settings.specialrequirements',
            icon: 'icon-lock'
        }, {
            title: 'Import',
            state: 'root.settings.import',
            icon: 'icon-lock'
        }, {
            title: 'Export',
            state: 'root.settings.exports',
            icon: 'icon-lock'
        }, {
            title: 'App Settings',
            state: 'root.settings.appsettings',
            icon: 'icon-equalizer22'
        }, {
            title: 'Google Config',
            state: 'root.settings.googlemapsconfig',
            icon: 'icon-map'
        }];

        subMenus = subMenus.filter(function (s) {
            return s.allow || $permissions.test(s.state.substring(5));
        });

        MenuServiceProvider.registerMenuItem({
            state: subMenus.length > 0 ? null : 'root.settings.profile',
            icon: 'settings',
            title: 'Settings',
            subMenus: subMenus
        });
    }

    SettingsController.$inject = ['$scope', 'rMenu'];

    function SettingsController($scope, rMenu) {
        $scope.menu = rMenu;

        angular.forEach(rMenu, function (menuItem) {
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
