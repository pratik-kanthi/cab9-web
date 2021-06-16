(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehicleItemCreateController', vehicleItemCreateController);

    vehicleItemCreateController.$inject = ['$scope', '$state', 'Model', 'rVehicleTypes', 'rVehicleTags', 'rVehicleClasses', 'rDrivers', '$UI', '$q', '$config', '$stateParams'];

    function vehicleItemCreateController($scope, $state, Model, rVehicleTypes, rVehicleTags, rVehicleClasses, rDrivers, $UI, $q, $config, $stateParams) {
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.vehicle = new Model.Vehicle();
        $scope.displayMode = "CREATE";
        $scope.vehicleTags = rVehicleTags;
        $scope.drivers = rDrivers;
        $scope.vehicle.VehicleTags = [];

        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        if($stateParams.DriverId) {
            $scope.vehicle.DriverId = $stateParams.DriverId;
        }

        function saveEdits() {
            $scope.saving = true;
            var promises = [];

            angular.forEach($scope.vehicle.VehicleTags, function (add) {
                promises.push(Model.$associate("Vehicle", "VehicleTags", $scope.vehicle.Id, add.Id));
            });

            promises.push($scope.vehicle.$save());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Vehicle Saved.",
                    text: "New Vehicle has been added.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go('root.vehicles.viewer.dashboard', {
                    Id: response[0].data.Id
                });
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }

        function cancelEditing() {
            $state.go('root.vehicles.cards');
        }
    }
})(angular);