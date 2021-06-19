(function (window, angular) {
    var module = angular.module('cab9.dashboard', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {

        $stateProvider.state('root.dashboard', {
            url: '/',
            showTimeControl: true,
            views: {
                'content-wrapper@root': {
                    controller: 'DashboardController',
                    templateUrl: '/webapp/management/dashboard/dashboard.partial.html'
                }
            }
        });

        MenuServiceProvider.registerMenuItem({
            state: 'root.dashboard',
            icon: 'dashboard',
            title: 'Dashboard'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }
})(window, angular);