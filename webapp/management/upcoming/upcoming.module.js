(function (window, angular) {
    var module = angular.module('cab9.upcoming', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider', '$permissions'];
    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider, $permissions) {
        if (!$permissions.test('upcoming')) return;

        $stateProvider.state('root.upcoming', {
            url: 'upcoming',
            views: {
                'content-wrapper@root': {
                    controller: 'UpcomingController',
                    templateUrl: '/webapp/management/upcoming/upcoming.partial.html'
                }
            }
        });

        MenuServiceProvider.registerMenuItem({
            state: 'root.upcoming',
            icon: 'icon-new-releases',
            title: 'Upcoming'
        });
    }

    moduleRun.$inject = [];
    function moduleRun() {

    }
})(window, angular);