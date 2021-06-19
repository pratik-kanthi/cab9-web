(function (angular) {
    var module = angular.module('cab9.common');
    module.controller('WebBookerAddressEditController', webBookerAddressEditController);
    webBookerAddressEditController.$inject = ['$scope', '$modalInstance', 'rAddress'];

    function webBookerAddressEditController($scope, $modalInstance, rAddress) {
        $scope.address = rAddress.address;
        $scope.save = save;
        $scope.displayMode = 'EDIT';

        function save() {
            $scope.address.StopSummary = window.$utilities.formatAddress($scope.address);
            $modalInstance.close({
                address: $scope.address,
                editIndex: rAddress.editIndex
            });
        }
    }
}(angular));