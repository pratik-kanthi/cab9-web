(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareFilterModalController', WorkshareFilterModalController);
    WorkshareFilterModalController.$inject = ['$scope', 'rFilter', '$modalInstance', '$http'];

    function WorkshareFilterModalController($scope, rFilter, $modalInstance, $http) {
        $scope.filterOptions = angular.copy(rFilter);
        $scope.filterOptions.addressFinder = {
                latitude: null,
                longitude: null
            },
            $scope.confirmFilters = confirmFilters;

        // confirm filters entered by the user
        function confirmFilters() {
            $modalInstance.close($scope.filterOptions);
        }
        $http.get($config.API_ENDPOINT + 'api/partners/services')
            .success(function (response) {
                $scope.services = response;
            })
            .error(function (res) {
                swal("Error", res.ExceptionMessage, "error");
            });
        // fetch the lat & long from the address entered by the user
        $scope.$on("address_changed", function (event, coordinates) {
            $scope.filterOptions.addressFinder.latitude = coordinates.latitude;
            $scope.filterOptions.addressFinder.longitude = coordinates.longitude;
        });
    }

})(angular);