(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientTypesModalController', clientTypesModalController);

    clientTypesModalController.$inject = ['$scope', '$modal', 'rData', 'Model', '$q', 'LookupCache'];

    function clientTypesModalController($scope, $modal, rData, Model, $q, LookupCache) {
        $scope.clientTypes = rData;
        $scope.selected = null;
        $scope.newClientType = null;
        $scope.selectClientType = selectClientType;
        $scope.updateClientType = updateClientType;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deleteClientType = deleteClientType;
        $scope.createNewClientType = createNewClientType;
        $scope.cancelSave = cancelSave;
        $scope.saveClientType = saveClientType;

        function createNewClientType() {
            $scope.newClientType = new Model.ClientType();
        }

        function selectClientType(dt) {
            $scope.selected = dt;
        }

        function updateClientType(dt) {
            dt.$patch().success(function () {
                swal("Success", "Client Type Updated", "success");
                refetch();
            });
            $scope.selected = null;
        }

        function saveClientType() {
            if ($scope.newClientType.Name.length > 0) {
                $scope.newClientType.$save().success(function () {
                    swal("Success", "Client Type Saved.", "success");
                    refetch();
                    $scope.newClientType = null;
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
            $scope.newClientType = null
        }

        function deleteClientType(dt) {
            dt.$delete().success(function () {
                swal('Success', 'Client Type Deleted', 'success');
                refetch();
            });
        }

        function refetch() {
            Model.ClientType
                .query()
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    LookupCache.ClientType = data;
                    LookupCache.ClientType.$updated = new moment();
                    $scope.clientTypes = data;
                });
        }
    }
})(angular);