(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverEstimateController', DriverEstimateController);

    DriverEstimateController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$rootScope'];

    function DriverEstimateController($scope, $modal, Model, $q, $http, $config, $rootScope) {
        $scope.data = [];
        $scope.formatUrl = function (path, callsign) {
            if (path) {
                if (path.slice(0, 4) == 'http') {
                    return path;
                } else {
                    return $config.RESOURCE_ENDPOINT + path;
                }
            } else {
                return $config.API_ENDPOINT + 'api/imagegen?text=' + (callsign || '').replace(/ /g, "+");
            }
        }
        $scope.showSearch = false;
        $scope.searchTerm = {};
        $scope.toggleSearch = toggleSearch;
        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus();
                }, 500);
            }
        }

        $scope.AveCommission = 0;
        $scope.MaxCommission = 0;
        $scope.DriverCount = 0;

        $scope.$watch('reportFilters', function () {
            fetch();
        }, true);

        function fetch() {
            $http.get($config.API_ENDPOINT + 'api/DriverPayments/estimate', {
                params: {
                    from: new moment($rootScope.reportFilters.from).format(),
                    to: new moment($rootScope.reportFilters.to).format()
                }
            }).then(function (response) {
                $scope.data = response.data;
                var max = 0;
                var maxItem = null;
                var total = 0;
                var count = 0;
                angular.forEach($scope.data, function (i) {
                    if (i.JourneyCommission > max) {
                        max = i.JourneyCommission
                        maxItem = i;
                    }
                    if (i.JourneyCommission > 0) {
                        count++;
                    }
                    total += i.JourneyCommission;
                });
                $scope.MaxCommission = max;
                $scope.DriverCount = count;
                $scope.AveCommission = (total / count) || 0;
                $scope.MaxItem = maxItem;
            })
        }
    }
})(angular);