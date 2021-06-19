(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientPassengersOptionsController', clientPassengersOptionsController);

    clientPassengersOptionsController.$inject = ['$scope', '$stateParams', '$state', '$q', '$config', '$modal', '$UI', '$http', 'Model', 'rData', 'rAccessors'];

    function clientPassengersOptionsController($scope, $stateParams, $state, $q, $config, $modal, $UI, $http, Model, rData, rAccessors) {
        $scope.staff = rData;
        $scope.toggleSearch = toggleSearch;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else if (!$scope.showSearch && $scope.serverSearchTerm) {
                $scope.serverSearchTerm.$ = '';
            } else {
                setTimeout(function() {
                    $('#searchTerm').focus()
                }, 500);
            }
        }
        $scope.newPassenger = newPassenger;

        function newPassenger() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/passenger/create.modal.html',
                controller: 'PassengerItemCreateModalController',
                resolve: {
                    rClientId: function () {
                        return $stateParams.Id
                    },
                    rNavigateAfterSave: function () {
                        return true;
                    }
                }
            })
        }
    }
}(angular))