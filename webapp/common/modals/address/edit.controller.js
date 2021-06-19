(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('AddressEditController', addressEditController);

    addressEditController.$inject = ['$scope', '$state', 'Model', '$UI', '$q', '$config', 'rAddress', '$modalInstance'];

    function addressEditController($scope, $state, Model, $UI, $q, $config, rAddress, $modalInstance) {
        $scope.address = rAddress;
        $scope.save = save;
        $scope.displayMode = 'EDIT';

        function save() {
            var promises = [];
            $scope.address.StopSummary = window.$utilities.formatAddress($scope.address);
            promises.push($scope.address.$patch());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Address Saved.",
                    text: "Changes have been updated",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(response[0].data);

            }, function () {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }
    }
}(angular))