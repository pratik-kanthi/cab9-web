(function (angular) {
    var module = angular.module('cab9.workshare', []);

    module.config(moduleConfig);
    module.controller('WorkshareController', WorkshareController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('workshare')) return;
        $stateProvider.state('root.workshare', {
            url: '/workshare',
            permission: 'Workshare',
            resolve: {
                rMenu: [
                    function () {
                        return [];
                    }
                ]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/workshare/partial.html',
                    controller: 'WorkshareController'
                }
            }
        });
        if ($permissions.test('workshare.requests')) {
            $stateProvider.state('root.workshare.requests', {
                url: '/requests',
                permission: 'Workshare - Requests',
                views: {
                    'workshare-content@root.workshare': {
                        templateUrl: '/webapp/management/workshare/requests/partial.html',
                        controller: 'WorkshareRequestsController'
                    }
                }
            });
        }
        if ($permissions.test('workshare.company')) {
            $stateProvider.state('root.workshare.company', {
                url: '/company',
                permission: 'Workshare - Company',
                resolve: {
                    rTabs: [
                        function () {
                            return [{
                                heading: 'Profile',
                                route: 'root.workshare.company.profile'
                            }, {
                                heading: 'Live Drivers',
                                route: 'root.workshare.company.live-drivers'
                            }, {
                                heading: 'Coverage Area',
                                route: 'root.workshare.company.coverage-area'
                            }, {
                                heading: 'Fleet',
                                route: 'root.workshare.company.fleet'
                            }, {
                                heading: 'Documents',
                                route: 'root.workshare.company.documents'
                            }, {
                                heading: 'Manage Partners',
                                route: 'root.workshare.company.partners'
                            }]
                        }
                    ],
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .select("Id, Name, LogoUrl, Address1, Address2, Area, TownCity, County, Postcode, Country")
                                .trackingEnabled()
                                .execute();
                        }
                    ],
                    rCompanyProfile: ['$http', '$config', 'Model', function ($http, $config, Model) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + 'api/partners/profile'
                        }).then(function successCallback(response) {
                            if (response.data)
                                return new Model.CompanyProfile(response.data);
                            else
                                return null
                        }, function errorCallback(error) {
                            swal("Error", error.ExceptionMessage, "error");
                        });
                    }],
                },
                views: {
                    'workshare-content@root.workshare': {
                        templateUrl: '/webapp/management/workshare/company/partial.html',
                        controller: 'WorkshareCompanyController'
                    }
                }
            });

            $stateProvider.state('root.workshare.company.profile', {
                url: '/profile',
                templateUrl: '/webapp/management/workshare/company/profile/partial.html',
                controller: 'WorkshareCompanyProfileController'
            });

            $stateProvider.state('root.workshare.company.coverage-area', {
                url: '/coverage-area',
                templateUrl: '/webapp/management/workshare/company/coverage-area/partial.html',
                controller: 'WorkshareCompanyCoverageAreaController'
            });
            $stateProvider.state('root.workshare.company.live-drivers', {
                url: '/live-drivers',
                templateUrl: '/webapp/management/workshare/company/live-drivers/partial.html',
                controller: 'WorkshareLiveDriversController'
            });

            $stateProvider.state('root.workshare.company.fleet', {
                url: '/fleet',
                templateUrl: '/webapp/management/workshare/company/fleet/partial.html',
                controller: 'WorkshareCompanyFleetController'
            });
            $stateProvider.state('root.workshare.company.partners', {
                url: '/partners',
                templateUrl: '/webapp/management/workshare/company/partners/partial.html',
                controller: 'WorkshareCompanyPartnersController'
            });

            $stateProvider.state('root.workshare.company.documents', {
                url: '/documents',
                views: {
                    '@root.workshare.company': {
                        controller: 'WorkshareCompanyDocumentsController',
                        templateUrl: '/webapp/management/workshare/company/document/partial.html'
                    },
                    'document-window@root.workshare.company.documents': {
                        controller: 'ModuleDocumentsController',
                        templateUrl: '/e9_components/layouts/module/module-documents.layout.html',
                        resolve: {
                            rDocuments: ['Auth', 'Model',
                                function (Auth, Model) {
                                    return Model.Document
                                        .query()
                                        .where("OwnerType eq 'Company'")
                                        .where("OwnerId eq guid'" + Auth.getSession().TenantId + "'")
                                        .include("DocumentType")
                                        .trackingEnabled()
                                        .execute();
                                }
                            ],
                            rDocumentTypes: ['$http', '$config',
                                function ($http, $config) {
                                    return $http({
                                        method: 'GET',
                                        url: $config.API_ENDPOINT + 'api/partners/documentTypes'
                                    })
                                }
                            ],
                            rConfig: ['Auth', 'rDocumentTypes',
                                function (Auth, rDocumentTypes) {
                                    return {
                                        docTypes: rDocumentTypes.data,
                                        onlyActive: true,
                                        type: "Company",
                                        id: Auth.getSession().TenantId
                                    };
                                }
                            ]
                        }
                    }
                },
            });
        }

        if ($permissions.test('workshare.discover-partner')) {
            $stateProvider.state('root.workshare.discover-partner', {
                url: '/discover-partner',
                permission: 'Workshare - Partners',
                views: {
                    'workshare-content@root.workshare': {
                        templateUrl: '/webapp/management/workshare/discover-partner/partial.html',
                        controller: 'WorkshareDiscoverPartnerController'
                    }
                },
                resolve: {
                    rCompany: ['Model', 'Auth',
                        function (Model, Auth) {
                            return Model.Company
                                .query()
                                .filter("Id eq guid'" + Auth.getSession().TenantId + "'")
                                .select("Id, Name, LogoUrl, Address1, Address2, Area, TownCity, County, Postcode, Country, BaseLatitude, BaseLongitude")
                                .trackingEnabled()
                                .execute();
                        }
                    ]
                }
            });
        }

        if ($permissions.test('workshare.partner')) {
            $stateProvider.state('root.workshare.partner', {
                url: '/partner/:Id',
                permission: 'Workshare - Partners',
                default: 'root.workshare.partner.details',
                views: {
                    'workshare-content@root.workshare': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/partial.html',
                        controller: 'WorksharePartnerController'
                    }
                },
                resolve: {
                    rTabs: [
                        function () {
                            return [{
                                heading: 'Details',
                                route: 'root.workshare.partner.details'
                            }, {
                                heading: 'Pricing',
                                route: 'root.workshare.partner.pricing'
                            }, {
                                heading: 'Coverage',
                                route: 'root.workshare.partner.live'
                            }, {
                                heading: 'Fleet',
                                route: 'root.workshare.partner.fleet'
                            }, {
                                heading: 'Documents',
                                route: 'root.workshare.partner.documents'
                            }]
                        }
                    ],
                    rCompanyProfile: ['$http', '$config', '$stateParams', function ($http, $config, $stateParams) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + 'api/partners/{tenantId}/profile?tenantId=' + $stateParams.Id
                        }).then(function successCallback(response) {
                            return response.data;
                        }, function errorCallback(error) {
                            swal("Error", error.ExceptionMessage, "error");
                        });
                    }]
                }
            });
        }

        if ($permissions.test('workshare.partner.details')) {
            $stateProvider.state('root.workshare.partner.details', {
                url: '/details',
                permission: 'Workshare - Partners',
                views: {
                    'tab-content@root.workshare.partner': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/details/partial.html',
                        controller: 'WorksharePartnerDetailsController'
                    }
                },
                resolve: {}
            });
        }

        if ($permissions.test('workshare.partner.pricing')) {
            $stateProvider.state('root.workshare.partner.pricing', {
                url: '/pricing',
                permission: 'Workshare - Partners',
                views: {
                    'tab-content@root.workshare.partner': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/pricing/partial.html',
                        controller: 'WorksharePartnerpricingController'
                    }
                },
                resolve: {}
            });
        }

        if ($permissions.test('workshare.partner.live')) {
            $stateProvider.state('root.workshare.partner.live', {
                url: '/live',
                permission: 'Workshare - Partners',
                views: {
                    'tab-content@root.workshare.partner': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/live/partial.html',
                        controller: 'WorksharePartnerLiveController'
                    }
                },
                resolve: {
                    rProfile: ['$http', '$config', 'Model', function ($http, $config, Model) {
                        return $http({
                            method: 'GET',
                            url: $config.API_ENDPOINT + 'api/partners/profile'
                        }).then(function successCallback(response) {
                            if (response.data)
                                return new Model.CompanyProfile(response.data);
                            else
                                return null
                        }, function errorCallback(error) {
                            swal("Error", error.ExceptionMessage, "error");
                        });
                    }],
                }
            });
        }

        if ($permissions.test('workshare.partner.fleet')) {
            $stateProvider.state('root.workshare.partner.fleet', {
                url: '/fleet',
                permission: 'Workshare - Partners',
                views: {
                    'tab-content@root.workshare.partner': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/fleet/partial.html',
                        controller: 'WorksharePartnerFleetController'
                    }
                }
            });
        }

        if ($permissions.test('workshare.partner.documents')) {
            $stateProvider.state('root.workshare.partner.documents', {
                url: '/documents',
                permission: 'Workshare - Partners',
                views: {
                    'tab-content@root.workshare.partner': {
                        templateUrl: '/webapp/management/workshare/discover-partner/item/documents/partial.html',
                        controller: 'WorksharePartnerDocumentsController'
                    }
                }
            });
        }



        var subMenus = [{
            title: 'Company Profile',
            state: 'root.workshare.company.profile',
            icon: 'icon-lock'
        }, {
            title: 'Discover Partners',
            state: 'root.workshare.discover-partner',
            icon: 'icon-lock'
        }, {
            title: 'Partner Requests',
            state: 'root.workshare.requests',
            icon: 'icon-lock'
        }];

        subMenus = subMenus.filter(function (s) {
            return s.allow || $permissions.test(s.state.substring(5));
        });

        MenuServiceProvider.registerMenuItem({
            state: subMenus.length > 0 ? null : 'root.workshare.company',
            icon: 'share',
            title: 'Workshare',
            subMenus: subMenus
        });
    }

    WorkshareController.$inject = ['$scope', 'rMenu'];

    function WorkshareController($scope, rMenu) {
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