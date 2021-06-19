(function (angular) {
    var module = angular.module('cab9.staff');

    module.controller('StaffItemInfoController', staffItemInfoController);

    staffItemInfoController.$inject = ['$scope', '$q', 'Model', 'rData', 'rCustomRoles', 'ImageUpload', '$UI','rAccessors','$state'];
    function staffItemInfoController($scope, $q, Model, rData, rCustomRoles, ImageUpload, $UI, rAccessors, $state) {
        $scope.staff = rData[0];
        $scope.accessors = rAccessors;
        $scope.customRoles = rCustomRoles;
        $scope.displayMode = 'VIEW';
        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;
        $scope.state = $state.$current.name.substring(5);

        function chooseImage() {
            ImageUpload.openPicker({ type: 'Staff', id: $scope.staff.Id, searchTerm: $scope.staff.Firstname + ' ' + $scope.staff.Surname })
               .then(function (result) {
                   $scope.staff.ImageUrl = result;
                   saveEdits();
               }, function (result) {
               });
        };

        function startEditing() {
            $scope.displayMode = 'EDIT';
        };

        function saveEdits() {
            $scope.saving = true;
            var promises = [];

            promises.push($scope.staff.$patch());

            $q.all(promises).then(function () {
                swal({
                    title: "Staff Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
                $scope.$emit('ITEM_UPDATED', $scope.staff);
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        };

        function cancelEditing() {
            $scope.staff.$rollback(true);
            $scope.displayMode = 'VIEW';
        };
    }
}(angular));