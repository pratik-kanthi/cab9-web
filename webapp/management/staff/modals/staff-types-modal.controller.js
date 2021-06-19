(function (angular) {
    var module = angular.module('cab9.staff');

    module.controller('StaffTypesModalController', staffTypesModalController);

    staffTypesModalController.$inject = ['$scope', '$modal', 'rData', 'Model', '$q', 'LookupCache'];

    function staffTypesModalController($scope, $modal, rData, Model, $q, LookupCache) {
        $scope.staffTypes = rData;
        $scope.selected = null;
        $scope.newStaffType = null;
        $scope.selectStaffType = selectStaffType;
        $scope.updateStaffType = updateStaffType;
        $scope.cancelUpdate = cancelUpdate;
        $scope.deleteStaffType = deleteStaffType;
        $scope.createNewStaffType = createNewStaffType;
        $scope.cancelSave = cancelSave;
        $scope.saveStaffType = saveStaffType;

        function createNewStaffType() {
            $scope.newStaffType = new Model.StaffType();
        }

        function selectStaffType(st) {
            $scope.selected = st;
        }

        function updateStaffType(st) {
            st.$patch().success(function () {
                swal("Success", "Staff Type Updated", "success");
                refetch();
            });

            $scope.selected = null;
        }

        function saveStaffType() {
            if ($scope.newStaffType.Name.length > 0) {
                $scope.newStaffType.$save().success(function () {
                    swal("Success", "Staff Type Saved", "success");
                    $scope.newStaffType = null;
                    refetch();
                }).error(function () {
                    swal({
                        title: "Error Occured",
                        type: 'error'
                    });
                });
            }
        }

        function cancelUpdate(st) {
            st.$rollback();
            $scope.selected = null;
        }

        function cancelSave() {
            $scope.newStaffType = null
        }

        function deleteStaffType(st) {
            st.$delete().success(refetch);
        }

        function refetch() {
            Model.StaffType
                .query()
                .trackingEnabled()
                .execute()
                .then(function (data) {
                    LookupCache.StaffType = data;
                    LookupCache.StaffType.$updated = new moment();
                    $scope.staffTypes = data;
                });
        }

    }
})(angular);