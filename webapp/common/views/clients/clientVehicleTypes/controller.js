(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientItemVehicleTypesController', clientItemVehicleTypesController);

    clientItemVehicleTypesController.$inject = ['$scope', '$stateParams', 'rVehicleTypes', '$state', '$q', '$config', '$UI', '$http', 'Model', 'rData'];

    function clientItemVehicleTypesController($scope, $stateParams, rVehicleTypes, $state, $q, $config, $UI, $http, Model, rData) {
        init();
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.addVehicle = addVehicle;
        $scope.removeVehicle = removeVehicle;
        $scope.saveChanges = saveChanges;

        function init() {
            $scope.viewMode = "VIEW";
            $scope.client = angular.copy(rData[0]);
            $scope.client.VehicleTypes = $scope.client.VehicleTypes.map(function (item) {
                return new Model.VehicleType(item);
            });
            var vehicleTypeIds = $scope.client.VehicleTypes.map(function (item) {
                return item.Id;
            })
            $scope.selected = {
                VehicleType: null
            };
            $scope.unlinkedVehicleTypes = rVehicleTypes.filter(function (item) {
                return vehicleTypeIds.indexOf(item.Id) == -1;
            });
        }

        function addVehicle(item) {
            $scope.client.VehicleTypes.push(item);
            var found = $scope.unlinkedVehicleTypes.filter(function (vt) {
                return vt.Id == item.Id
            });
            if (found[0])
                $scope.unlinkedVehicleTypes.splice($scope.unlinkedVehicleTypes.indexOf(found[0]), 1)
            $scope.selected.VehicleType = null;
        }

        function removeVehicle(item) {
            $scope.unlinkedVehicleTypes.push(item);
            var found = $scope.client.VehicleTypes.filter(function (vt) {
                return vt.Id == item.Id;
            })
            if (found[0])
                $scope.client.VehicleTypes.splice($scope.client.VehicleTypes.indexOf(found[0]), 1)
        }


        function saveChanges() {
            $http.post($config.API_ENDPOINT + "api/client/ManageVehicleTypes", $scope.client).then(function (response) {
                swal({
                    title: "Client Vehicle Types Updated",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go($state.current, {
                    Id: $stateParams.Id
                }, {
                    reload: true
                })
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function cancelEdit() {
            init();
        }

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }
    }
}(angular))