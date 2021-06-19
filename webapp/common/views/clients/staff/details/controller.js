(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientStaffItemDetailController', clientStaffItemDetailController);

    clientStaffItemDetailController.$inject = ['$scope', '$stateParams', '$rootScope', '$state', '$q', '$config', '$UI', '$http', 'Model', 'ImageUpload', 'rData', 'rRoles'];

    function clientStaffItemDetailController($scope, $stateParams, $rootScope, $state, $q, $config, $UI, $http, Model, ImageUpload, rData, rRoles) {
        $scope.staff = rData[0];
        $scope.roles = rRoles;
        $rootScope.backAvailable = $stateParams.Id ? "root.clients.viewer.staff.cards({Id:'" + $stateParams.Id + "'})" : "root.staff.cards";
        $scope.viewMode = 'VIEW';
        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.save = save;

        $scope.cancelEdit = cancelEdit;

        function cancelEdit() {
            $scope.staff.$rollback(true);
            $scope.viewMode = 'VIEW';
        }

        function chooseImage() {
            ImageUpload.openPicker({
                type: 'staff',
                id: $scope.staff.Id,
                searchTerm: $scope.staff._Fullname
            })
                .then(function (result) {
                    $scope.staff.ImageUrl = result;
                    save();
                }, function (result) { });
        };

        function startEditing() {
            $scope.viewMode = 'EDIT';
        }

        function save() {
            var promises = [];
            promises.push($scope.staff.$patch(true));
            $q.all(promises).then(function () {
                swal({
                    title: "Staff Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });

                $state.go($state.current, null, {
                    reload: true
                })
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
}(angular));