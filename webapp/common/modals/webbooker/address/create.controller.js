(function (angular) {
    var module = angular.module('cab9.common');
    module.controller('WebBookerAddressCreateController', webBookerAddressCreateController);
    webBookerAddressCreateController.$inject = ['$scope', '$modalInstance', 'rAddress'];

    function webBookerAddressCreateController($scope, $modalInstance, rAddress) {
        $scope.address = rAddress;
        $scope.address.StopSummary = "";
        $scope.displayMode = 'CREATE';
        $scope.save = save;

        function save() {
            $scope.address.StopSummary = window.$utilities.formatAddress($scope.address);
            $modalInstance.close($scope.address);
        }
    }
}(angular));