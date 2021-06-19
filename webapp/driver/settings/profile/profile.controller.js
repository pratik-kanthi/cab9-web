(function (angular) {
    var module = angular.module('cab9.driver.settings');

    module.controller('SettingsProfileController', settingsProfileController);

    settingsProfileController.$inject = ['$scope', '$q', 'ImageUpload', 'rData', '$UI', 'rAccessors'];

    function settingsProfileController($scope, $q, ImageUpload, rData, $UI, rAccessors) {
        $scope.driver = rData[0];
        $scope.accessors = rAccessors;
        $scope.displayMode = 'VIEW';

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;

        function chooseImage() {
            ImageUpload.openPicker({ type: 'Driver', id: $scope.driver.Id, searchTerm: $scope.driver._Fullname })
               .then(function (result) {
                   $scope.driver.ImageUrl = result;
                   saveEdits();
               }, function (result) {
               });
        };

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }
        function cancelEditing() {
            $scope.driver.$rollback(true);
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            var promises = [];

            promises.push($scope.driver.$patch());

            $q.all(promises).then(function () {
                swal({
                    title: "Profile Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }
    }
})(angular);

