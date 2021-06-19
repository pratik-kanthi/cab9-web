(function (angular) {
    var module = angular.module('cab9.utilities', []);

    module.config(moduleConfig);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('utilities')) return;
        var subMenus = [];
        var defaultState = "";
        $stateProvider.state('root.utilities', {
            url: '/utilities',
            permission: 'Utilities Module',
            resolve: {
                rMenu: [function () {
                    return [];
                }]
            },
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/utilities/utilities.layout.html'
                }
            }
        });
        $urlRouterProvider.when('/utilities', '/utilities/documents');
        if ($permissions.test('utilities.documents')) {
            defaultState = "root.utilities.documents";
            $stateProvider.state('root.utilities.documents', {
                url: '/documents',
                permission: 'Documents',
                resolve: {
                    rDocuments: ['Model', function (Model) {
                        return Model.Document
                            .query()
                            .include('DocumentType')
                            .execute();
                }],
                    rDocumentTypes: ['Model', function (Model) {
                        return Model.DocumentType
                            .query()
                            .execute();
                }]
                },
                views: {
                    'utilities-content@root.utilities': {
                        controller: 'DocumentsController',
                        templateUrl: '/webapp/management/utilities/documents/all/partial.html'
                    },
                    'options-area@root.utilities.documents': {
                        templateUrl: '/webapp/management/utilities/documents/all/options.partial.html',
                        controller: 'DocumentsOptionsController'
                    }
                }
            });
            subMenus.push({
                title: 'Documents',
                state: 'root.utilities.documents',
                icon: 'settings_input_component'
            })
        }

        MenuServiceProvider.registerMenuItem({
            state: defaultState,
            icon: 'build',
            title: 'Utilities',
            subMenus: subMenus.filter(function (s) {
                return s.state.substring(5);
            })
        });

        UtilitiesController.$inject = ['$scope', 'rMenu'];

        function UtilitiesController($scope, rMenu) {
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

    }

}(angular));