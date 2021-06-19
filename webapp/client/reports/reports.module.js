(function (window, angular) {
    var module = angular.module('cab9.client.report', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('superadmin')) return;
        $stateProvider.state('root.reports', {
            url: '/reports',
            permission: 'Reports',
            views: {
                'content-wrapper@root': {
                    templateUrl: '/webapp/client/reports/all/reports.partial.html',
                    controller: 'ReportsController'
                }
            },
            resolve: {
                rPassengers: ['Model', function (Model) {
                    return [];
                }],
                rVehicleTypes: ['Model', function (Model) {
                    return Model.VehicleType.query().execute();
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