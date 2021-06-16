(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientItemPassengersController', clientItemPassengersController);

    clientItemPassengersController.$inject = ['$scope', 'rPassengers', '$stateParams', '$modal'];

    function clientItemPassengersController($scope, rPassengers, $stateParams, $modal) {
        $scope.passengers = angular.copy(rPassengers);
        $scope.newPassenger = newPassenger;
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

        $scope.$watch('searchTerm.$', function (newValue, oldValue) {
            if (newValue && newValue.trim() != "") {
                $scope.passengers = rPassengers.filter(function (item) {
                    return (item._Fullname + item.Phone + item.Mobile + item.Email + item._Addresses).toLowerCase().indexOf(newValue.toLowerCase()) != -1
                });
            } else {
                $scope.passengers = angular.copy(rPassengers);

            }
        })

        function newPassenger() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                controller: 'PassengerItemCreateModalController',
                resolve: {
                    rClientId: function () {
                        return $stateParams.Id;
                    },
                    rNavigateAfterSave: function () {
                        return true;
                    }
                }
            })
        }

    }
}(angular))