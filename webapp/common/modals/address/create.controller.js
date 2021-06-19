(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('AddressCreateController', addressCreateController);

    addressCreateController.$inject = ['$scope', '$state', 'Model', '$UI', '$q', '$config', 'rAddress', '$modalInstance'];

    function addressCreateController($scope, $state, Model, $UI, $q, $config, rAddress, $modalInstance) {
        $scope.address = rAddress;
        $scope.save = save;
        $scope.displayMode = 'CREATE';

        function save() {
            var promises = [];
            
            $scope.address.StopSummary = window.$utilities.formatAddress($scope.address);
            promises.push($scope.address.$save());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Address Saved.",
                    text: "New Address has been added.",
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