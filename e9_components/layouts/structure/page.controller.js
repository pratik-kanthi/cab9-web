(function(window, angular) {
    var app = angular.module("framework.UI.structure", []);

    app.controller('PageController', pageController);

    pageController.$inject = ['$scope', '$interval', '$modal', '$rootScope', 'AUTH_EVENTS'];

    function pageController($scope, $interval, $modal, $rootScope, AUTH_EVENTS) {
        //setupUIElements();
        if (!window.CAB9Instance) {
            var instance = new CAB9();
            instance.init();
            window.CAB9Instance = instance;
        }

        $scope.showAlert = function showAlert() {
            $modal.open({
                templateUrl: '/webapp/common/modals/alert/modal.html',
                windowClass: 'christmas',
                size: 'lg'
            });
        }

        $scope.logout = function () {
            $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
        };
    };

})(window, angular);
