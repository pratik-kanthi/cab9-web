(function (window, angular) {
    var app = angular.module("cab9.layout", []);

    app.controller('SidebarController', sidebarController);

    sidebarController.$inject = ['$scope', '$interval', 'MenuService', '$rootScope', 'Auth', 'AUTH_EVENTS', '$http', '$utilities'];

    function sidebarController($scope, $interval, MenuService, $rootScope, Auth, AUTH_EVENTS, $http, $utilities) {
        $scope.menu = MenuService;
        $rootScope.USER = Auth.getSession();
        var text = $rootScope.USER.Name;
        if ($rootScope.USER.Name.indexOf(' ')) {
            text = $rootScope.USER.Name.split(' ')[0];
        }
        $rootScope.USER.ImageUrl = $scope.formatImage($rootScope.USER.ImageUrl, text);

        $(".mobile #navigation").click(function () {
            $("#application-layout").removeClass('sidebar-visible');
        });

        $scope.logout = function () {
            $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
        };

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            $scope.menu.menuItems.filter(function (m) {
                //Todo: Expand Items
            })
        });

    };

})(window, angular);