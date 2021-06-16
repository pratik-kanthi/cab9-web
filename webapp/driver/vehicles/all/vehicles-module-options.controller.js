(function (angular) {
    var module = angular.module('cab9.driver.vehicles');

    module.controller('VehiclesModuleOptionsController', vehiclesModuleOptionsController);

    vehiclesModuleOptionsController.$inject = ['$scope', '$modal'];

    function vehiclesModuleOptionsController($scope, $modal) {
        $scope.toggleSearch = toggleSearch;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }
    }
}(angular))