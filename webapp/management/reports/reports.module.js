/// <reference path="../../index.html" />
(function (window, angular) {
    var module = angular.module('cab9.report', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('reports')) return;

        $stateProvider.state('root.reports', {
            url: '/reports',
            permission: 'Reports',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/management/reports/all/reports.partial.html',
                    controller: 'ReportsController'
                }
            },
            resolve: {
                rDrivers: ['Model', function (Model) {
                    return []
                }],
                rClients: ['Model', function (Model) {
                    return [];
                }],
                rPassengers: ['Model', function (Model) {
                    return [];
                }],
                rVehicleTypes: ['Model', function (Model) {
                    return Model.VehicleType.query().execute();
                }],
                rVehicleClasses: ['Model', function (Model) {
                    return Model.VehicleClass.query().execute();
                }],
                rCurrencies: ['Model', function (Model) {
                    return Model.Currency
                        .query()
                        .execute();

                }]
            }
        });

        MenuServiceProvider.registerMenuItem({
            state: 'root.reports',
            icon: 'assessment',
            title: 'Reports'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }
    
})(window, angular);