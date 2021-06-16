(function(window, angular) {
    var app = angular.module("cab9.layout");

    app.controller('ClientSidebarController', sidebarController);

    sidebarController.$inject = ['$scope', '$interval', 'MenuService', '$rootScope', 'Auth', 'AUTH_EVENTS', '$http', '$utilities', 'Model'];

    function sidebarController($scope, $interval, MenuService, $rootScope, Auth, AUTH_EVENTS, $http, $utilities, Model) {
        $scope.menu = MenuService;
        $rootScope.USER = Auth.getSession();

        
        // if(!$rootScope.CARD_PAYMENTS_ENABLED){
        //     let settings = MenuService.menuItems.find(element => element.title === 'Settings');
        //     let transactions = settings.subMenus.find(element => element.title === 'Transactions');
        //     if (transactions.title === 'Transactions'){
        //         let index = settings.subMenus.indexOf({title: 'Transactions'});
        //         settings.subMenus.splice(index, 1);
        //     }
        // }
        
        var text = $rootScope.USER.Name;

        var clientId = $rootScope.USER.Claims.ClientId[0];

        Model.Client
            .query()
            .where('Id', '==', "guid'" + clientId + "'")
            .execute()
            .then(function(data) {
                $scope.CLIENT = data[0];
            });

        if ($rootScope.USER.Name.indexOf(' ')) {
            text = $rootScope.USER.Name.split(' ')[0];
        }
        $rootScope.USER._ImageUrl = $utilities.formatUrl($rootScope.USER.ImageUrl, text);

        $(".mobile #navigation").click(function() {
            $("#application-layout").removeClass('sidebar-visible');
        });

        $scope.logout = function() {
            $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
        };

        $rootScope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
            $scope.menu.menuItems.filter(function(m) {
                //Todo: Expand Items
            })
        });

    };

})(window, angular);
