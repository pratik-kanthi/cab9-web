(function (window, angular) {
    var module = angular.module('cab9.conversations', [])

    module.config(moduleConfig);
    module.run(moduleRun);

    moduleConfig.$inject = ['$stateProvider', 'MenuServiceProvider', '$urlRouterProvider'];

    function moduleConfig($stateProvider, MenuServiceProvider, $urlRouterProvider) {

        $stateProvider.state('root.conversations', {
            url: '/conversations',
            views: {
                'content-wrapper@root': {
                    controller: 'DashboardController',
                    templateUrl: '/webapp/management/conversations/conversations.partial.html'
                }
            }
        });

        MenuServiceProvider.registerMenuItem({
            state: 'root.conversations',
            icon: 'dashboard',
            title: 'Conversations'
        });
    }

    moduleRun.$inject = [];

    function moduleRun() {

    }
})(window, angular);