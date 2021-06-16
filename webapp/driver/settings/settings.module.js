(function (angular) {
    var module = angular.module('cab9.driver.settings', []);

    module.config(moduleConfig);
    module.controller('SettingsController', SettingsController);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {
        $stateProvider.state('root.settings', {
            url: '/settings',
            resolve: {
                rMenu: [function () {
                    return [];
                }]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/driver/settings/settings.layout.html',
                    controller: 'SettingsController'
                }
            }
        });

        $urlRouterProvider.when('/settings', '/settings/profile');

        $stateProvider.state('root.settings.profile', {
            url: '/profile',
            views: {
                'settings-content@root.settings': {
                    templateUrl: '/webapp/driver/settings/password/change-password.partial.html',
                    controller: 'SettingsPasswordController'
                },
                'profile-staff@root.settings.profile': {
                    templateUrl: '/webapp/driver/settings/profile/profile.partial.html',
                    controller: 'SettingsProfileController',
                    resolve: {
                        'rData': ['Model', '$stateParams', 'Auth', '$q', function (Model, $stateParams, Auth, $q) {
                            var defered = $q.defer();
                            Model.User
                                .query()
                                .where('Id', '==', "'" + Auth.getSession().UserId + "'")
                                .include('Claims')
                                .execute()
                                .then(function (user) {
                                    var driverClaim = user[0].Claims.filter(function (c) {
                                        return c.ClaimType == "DriverId"
                                    })[0];
                                    if (driverClaim) {
                                        Model.Driver
                                            .query()
                                            .where('Id', '==', "guid'" + driverClaim.ClaimValue + "'")
                                            .execute()
                                            .then(function (res) {
                                                defered.resolve(res);
                                            });
                                    }
                                });
                            return defered.promise;
                        }],
                        rAccessors: ['$config', function ($config) {
                            return {
                                Id: function (item) { return item.Id; },
                                Title: function (item) { return item.Firstname + ' ' + item.Surname; },
                                SubTitle: function (item) { return item.Callsign; },
                                LogoUrl: function (item) { return item._ImageUrl; }
                            };
                        }]
                    }
                }
            }
        });

        //#endregion
        var subMenus = [{
            title: 'Profile',
            state: 'root.settings.profile',
            icon: 'icon-lock'
        }];

        MenuServiceProvider.registerMenuItem({
            state: 'root.settings.profile',
            icon: 'icon-user-tie',
            title: 'Settings',
            subMenus: subMenus.filter(function (s) {
                return s.state.substring(5);
            })
        });
    }

    SettingsController.$inject = ['$scope', 'rMenu'];

    function SettingsController($scope, rMenu) {
        $scope.menu = rMenu;

        angular.forEach(rMenu, function (menuItem) {
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
}(angular));
