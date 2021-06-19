(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverTypesModalController', driverTypesModalController);

    driverTypesModalController.$inject = ['$scope', '$modal', 'rData', 'Model', '$q', 'LookupCache', 'rPaymentModels'];

    function driverTypesModalController($scope, $modal, rData, Model, $q, LookupCache, rPaymentModels) {
        $scope.driverTypes = rData;
        $scope.selected = null;
        $scope.newDriverType = null;
        $scope.selectDriverType = selectDriverType;
        $scope.updateDriverType = updateDriverType;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deleteDriverType = deleteDriverType;
        $scope.createNewDriverType = createNewDriverType;
        $scope.cancelSave = cancelSave;
        $scope.saveDriverType = saveDriverType;
        $scope.paymentModels = rPaymentModels;

        function createNewDriverType() {
            $scope.newDriverType = new Model.DriverType();
        }

        function selectDriverType(dt) {
            $scope.selected = dt;
        }

        function updateDriverType(dt) {
            dt.$patch().success(function () {
                swal('Success', 'Driver Type Updated', 'success');
                refetch();
            });

            $scope.selected = null;
        }

        function saveDriverType() {
            if ($scope.newDriverType.Name.length > 0) {
                $scope.newDriverType.$save().success(function () {
                    swal('Success', 'Driver Type Saved', 'success');
                    $scope.newDriverType = null;
                    refetch();
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
            $scope.newDriverType = null
        }

        function deleteDriverType(dt) {
            dt.$delete().success(function () {
                swal('Success', 'Driver Type Deleted', 'success');
                refetch();
            });
        }

        function refetch() {
            Model.DriverType
                .query()
                .include('DefaultDriverPaymentModel')
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    LookupCache.DriverType = data;
                    LookupCache.DriverType.$updated = new moment();
                    $scope.driverTypes = data;
                });
        }

    }
})(angular);