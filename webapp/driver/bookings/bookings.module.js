(function (angular) {
    var module = angular.module('cab9.driver.bookings', []);

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {
        $urlRouterProvider.when('/', '/bookings');
        $urlRouterProvider.when('', '/bookings');

        $stateProvider.state('root.bookings', {
            url: '/bookings',
            views: {
                'content-wrapper@root': {
                    controller: 'BookingsTableController',
                    templateUrl: '/webapp/driver/bookings/bookings-table.partial.html'
                }
            }
        });
        
        MenuServiceProvider.registerMenuItem({
            state: 'root.bookings',
            icon: 'icon-calendar2',
            title: 'Bookings'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }


}(angular));