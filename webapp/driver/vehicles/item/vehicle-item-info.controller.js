(function (angular) {
    var module = angular.module('cab9.driver.vehicles');

    module.controller('VehicleItemInfoController', vehicleItemInfoController);

    vehicleItemInfoController.$inject = ['$scope', '$q', 'Model', 'rData', 'rVehicleTypes', 'rVehicleTags', 'rVehicleClasses', '$UI', '$config'];

    function vehicleItemInfoController($scope, $q, Model, rData, rVehicleTypes, rVehicleTags, rVehicleClasses, $UI, $config) {
        $scope.vehicle = rData[0];
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleTags = rVehicleTags;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.displayMode = 'VIEW';

        for (var i = 0; i < $scope.vehicle.VehicleTags.length; i++) {
            var req = $scope.vehicle.VehicleTags[i];
            var found = $scope.vehicleTags.filter(function (dr) {
                return dr.Id == req.Id;
            });
            if (found.length == 1) {
                $scope.vehicle.VehicleTags[i] = found[0];
            }
        }

        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.vehicle.$rollback(true);
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            var promises = [];

            if (angular.isDefined($scope.vehicle.$$changedValues.VehicleTags)) {
                var changes = $scope.vehicle.$$originalValues.VehicleTags.changes($scope.vehicle.$$changedValues.VehicleTags, function (a, b) {
                    return a.Id == b.Id;
                });
                angular.forEach(changes.removed, function (remove) {
                    promises.push(Model.$dissociate("Vehicle", "VehicleTags", $scope.vehicle.Id, remove.Id));
                });
                angular.forEach(changes.added, function (add) {
                    promises.push(Model.$associate("Vehicle", "VehicleTags", $scope.vehicle.Id, add.Id));
                });
            }

            promises.push($scope.vehicle.$patch(true));

            $q.all(promises).then(function () {
                swal({
                    title: "Vehicle Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
                $scope.$emit('ITEM_UPDATED', $scope.vehicle);
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }
    }
})(angular);