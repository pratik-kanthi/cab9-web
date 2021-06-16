(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('PassengerItemAddressesController', passengerItemAddressesController);

    passengerItemAddressesController.$inject = ['$scope', 'rAddresses', '$state', '$modal', '$stateParams', '$q', 'Model', '$config', '$UI'];

    function passengerItemAddressesController($scope, rAddresses, $state, $modal, $stateParams, $q, Model, $config, $UI) {
        $scope.addresses = rAddresses;
        $scope.displayMode = "VIEW";
        $scope.newAddress = newAddress;
        $scope.editAddress = editAddress;
        $scope.deleteAddress = deleteAddress;

        function editAddress(address) {
            var index = $scope.addresses.indexOf(address);
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/address/modal.html',
                controller: 'AddressEditController',
                resolve: {
                    rAddress: function () {
                        return new Model.PassengerAddress(address);
                    }
                }
            })

            modalInstance.result.then(function (data) {
                $scope.addresses[index] = new Model.PassengerAddress(data);
            }, function () {

            });
        }

        function newAddress() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/address/modal.html',
                controller: 'AddressCreateController',
                size: 'lg',
                resolve: {
                    rAddress: function () {
                        var address = new Model.PassengerAddress();
                        address.PassengerId = $stateParams.Id;
                        return address;
                    }
                }
            });
            modalInstance.result.then(function (data) {
                $scope.addresses.push(new Model.PassengerAddress(data));
            }, function () {

            });

        }

        function deleteAddress(address) {
            swal({
                    title: "Are you sure?",
                    text: "Address will be deleted",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes, delete it!',
                    closeOnConfirm: false
                },
                function () {
                    var index = $scope.addresses.indexOf(address);
                    new Model.PassengerAddress(address).$delete().then(function (response) {
                        swal({
                            title: "Address Deleted.",
                            text: "Address has been deleted.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        $scope.addresses.splice(index, 1);
                    })
                },
                function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
        }
    }
}(angular))