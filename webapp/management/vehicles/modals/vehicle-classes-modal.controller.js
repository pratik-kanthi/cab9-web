(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehicleClassesModalController', VehicleClassesModalController);

    VehicleClassesModalController.$inject = ['$scope', '$modal', 'rData', '$UI', 'Model', '$q', 'LookupCache'];

    function VehicleClassesModalController($scope, $modal, rData, $UI, Model, $q, LookupCache) {
        $scope.vehicleClasses = rData;
        $scope.selected = null;
        $scope.newVehicleClass = null;
        $scope.selectVehicleClass = selectVehicleClass;
        $scope.updateVehicleClass = updateVehicleClass;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deleteVehicleClass = deleteVehicleClass;
        $scope.createNewVehicleClass = createNewVehicleClass;
        $scope.cancelSave = cancelSave;
        $scope.saveVehicleClass = saveVehicleClass;

        function createNewVehicleClass() {
            $scope.newVehicleClass = new Model.VehicleClass();
        }

        function selectVehicleClass(dt) {
            $scope.selected = dt;
        }

        function updateVehicleClass(dt) {
            dt.$patch().success(function () {
                swal("Success", "Vehicle Type Updated", "success");
                refetch();
            });
            $scope.selected = null;
        }

        function saveVehicleClass() {
            if ($scope.newVehicleClass.Name.length > 0) {
                $scope.newVehicleClass.$save().success(function () {
                    swal("Success", "Vehicle Type Saved.", "success");
                    refetch();
                    $scope.newVehicleClass = null;
                }).error(function () {
                    swal({
                        title: "Error Occured",
                        type: 'error'
                    });
                });
            }
        }

        function cancelUpdate(dt) {
            dt.$rollback();
            $scope.selected = null;
        }

        function cancelSave() {
            $scope.newVehicleClass = null
        }

        function deleteVehicleClass(dt) {
            dt.$delete().success(function () {
                refetch();
                swal({
                    title: "Vehicle Class Deleted",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        }

        function refetch() {
            Model.VehicleClass
                .query()
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    LookupCache.VehicleClass = data;
                    LookupCache.VehicleClass.$updated = new moment();
                    $scope.vehicleClasses = data;
                });
        }

    }
})(angular);