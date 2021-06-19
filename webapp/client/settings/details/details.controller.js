(function (angular) {
    var module = angular.module('cab9.client.settings');

    module.controller('SettingsDetailsController', settingsDetailsController);

    settingsDetailsController.$inject = ['$scope', '$q', 'Model', 'ImageUpload', 'rData', '$UI', '$config'];

    function settingsDetailsController($scope, $q, Model, ImageUpload, rData, $UI, $config) {
        $scope.client = rData[0];
        $scope.displayMode = 'VIEW';

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;

        $scope.accessors = {
            LogoUrl: function () {
                return rData[0]._ImageUrl;
            }
        };

        function chooseImage() {
            ImageUpload.openPicker({
                type: 'Client',
                id: $scope.client.Id,
                searchTerm: $scope.client.Name
            })
                .then(function (result) {
                    $scope.client.ImageUrl = result;
                    saveEdits();
                }, function (result) { });
        };

        function startEditing() {
            $scope.displayMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.client.$rollback(true);
            $scope.displayMode = 'VIEW';
        }

        function saveEdits() {
            var promises = [];
            
            promises.push($scope.client.$patch());

            $q.all(promises).then(function () {
                swal({
                    title: "Client Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
                $scope.$emit('ITEM_UPDATED', $scope.client);
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }
    }
})(angular);