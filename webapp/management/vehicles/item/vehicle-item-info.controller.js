(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehicleItemInfoController', vehicleItemInfoController);

    vehicleItemInfoController.$inject = ['$scope', '$q', 'Model', 'rData', 'rVehicleTypes', 'rVehicleTags', 'rVehicleClasses', 'rDrivers', '$UI', '$config'];

    function vehicleItemInfoController($scope, $q, Model, rData, rVehicleTypes, rVehicleTags, rVehicleClasses, rDrivers, $UI, $config) {
        $scope.vehicle = rData[0];
        $scope.vehicleTypes = rVehicleTypes;
        $scope.vehicleTags = rVehicleTags;
        $scope.vehicleClasses = rVehicleClasses;
        $scope.drivers = rDrivers;
        $scope.displayMode = 'VIEW';

        var originalTags = angular.copy($scope.vehicle.Tags);

        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;
        $scope.deleteV = deleteV;
        $scope.alreadySelected = alreadySelected;
                
        function startEditing() {
            $scope.displayMode = 'EDIT';
        }
        function cancelEditing() {
            $scope.vehicle.$rollback(true);
            $scope.displayMode = 'VIEW';
        }

        function deleteV() {
            $scope.vehicle.$delete(true);
        }

        function saveEdits() {
            var promises = [];

            if (angular.isDefined($scope.vehicle.$$changedValues.Tags)) {
                var changes = originalTags.changes($scope.vehicle.$$changedValues.Tags, function (a, b) { return a.Id == b.Id; });
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

        function alreadySelected(tag) {
            var currentTagIds = $scope.vehicle.Tags.map(function (t) { return t.Id });

            return currentTagIds.indexOf(tag.Id) == -1
        }
    }
})(angular);