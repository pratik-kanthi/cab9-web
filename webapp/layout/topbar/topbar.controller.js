(function (window, angular) {
    var app = angular.module("cab9.layout");

    app.controller('TopBarController', topBarController);

    topBarController.$inject = ['$scope', '$state', '$modal', '$rootScope','Auth', 'AUTH_EVENTS'];
    function topBarController($scope, $state, $modal, $rootScope, Auth, AUTH_EVENTS) {
        $scope.pageName = '';
        $scope.quickNavigateInit = quickNavigateInit;
        $scope.username = "";
        $scope.quickBookingAvailable = true;
    
        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            _parseStateName(toState.name);
            
        });

        $rootScope.addQuickBooking = addQuickBooking;

        function addQuickBooking() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/quick-booking/partial.html',
                controller: 'QuickBookingCreateController',
                windowClass: 'quick-booking',
                backdropClass: 'quick-booking-backdrop'
            });
            $scope.quickBookingAvailable = false;
            modalInstance.result.then(function () {
                $scope.quickBookingAvailable = true;
            }, function () {
                $scope.quickBookingAvailable = true;
            });
        }

        $rootScope.$on(AUTH_EVENTS.LOGIN_SUCCESS, function () {
            var user = Auth.getSession();
            $scope.username = user.UserName;
        });

        var user = Auth.getSession();
        if (user) {
            $scope.username = user.UserName;
        }

        _parseStateName($state.current.name);

        function _parseStateName(stateName) {
            var parts = stateName.split('.');
            var breadcrumbs = [];
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (p === "root")
                    continue;
                breadcrumbs.push(parts[i]);
            }
            $scope.pageName = breadcrumbs[0];
        }

        function quickNavigateInit() {
            $rootScope.showQuickNav = true;
            //swal("Quick Navigate is Coming Soon", "Quick Navigate is the fastest way to browse around Cab9. Quick Navigate pulls information from all the modules within Cab9 and returns your search based suggestions. It’s smart about which information it returns, so you’ll find just what you’re looking for. The results appear in rich, interactive previews that let you do a lot, just by clicking.")
        }

        //$scope.logout = Auth.logout;
        $scope.logout = function () {
            $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
        };

        var ctrlKey = 17, sKey = 32;
        $(document).on('keydown', function (e) {
            if ($rootScope.quickNavAvailable && (e.metaKey || e.ctrlKey) && e.keyCode == sKey) {
                e.preventDefault();
                e.stopPropagation();
                $rootScope.showQuickNav = true;
                $rootScope.$apply();
            }
        });
    };
})(window, angular);