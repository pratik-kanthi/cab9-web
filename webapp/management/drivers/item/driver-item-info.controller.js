(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverItemInfoController', driverItemInfoController);

    driverItemInfoController.$inject = ['$scope', '$q', 'Model', 'rData', 'rDriverTypes', 'rTags', 'ImageUpload', '$UI', 'rPaymentModels', 'rVehicles'];

    function driverItemInfoController($scope, $q, Model, rData, rDriverTypes, rTags, ImageUpload, $UI, rPaymentModels, rVehicles) {
        $scope.driver = rData[0];
        $scope.vehicles = rVehicles;
        $scope.driverTypes = rDriverTypes;
        $scope.driverTags = rTags;
        $scope.displayMode = 'VIEW';
        $scope.paymentModels = rPaymentModels;

        var originalTags = angular.copy($scope.driver.Tags);

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;
        $scope.deleteD = deleteD;
        $scope.alreadySelected = alreadySelected;

        //$scope.$watch('driver.Active', function (newValue, oldValue) {
        //    if (newValue != oldValue && newValue) {
        //        $scope.driver.InactiveReason = '';
        //    }
        //});

        function deleteD() {
            $scope.driver.$delete();
        }

        function chooseImage() {
            ImageUpload.openPicker({
                    type: 'Driver',
                    id: $scope.driver.Id,
                    searchTerm: $scope.driver.Firstname + ' ' + $scope.driver.Surname
                })
                .then(function (result) {
                    $scope.driver.ImageUrl = result;
                    saveEdits();
                }, function (result) {});
        };

        function startEditing() {
            $scope.displayMode = 'EDIT';
        };

        function saveEdits() {
            var promises = [];

            if (angular.isDefined($scope.driver.$$changedValues.Tags)) {
                var changes = originalTags.changes($scope.driver.$$changedValues.Tags, function (a, b) {
                    return a.Id == b.Id;
                });
                angular.forEach(changes.removed, function (remove) {
                    promises.push(Model.$dissociate("Driver", "DriverTags", $scope.driver.Id, remove.Id));
                });
                angular.forEach(changes.added, function (add) {
                    promises.push(Model.$associate("Driver", "DriverTags", $scope.driver.Id, add.Id));
                });
            }


            promises.push($scope.driver.$patch());

            $q.all(promises).then(function () {
                swal({
                    title: "Driver Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.displayMode = 'VIEW';
                $scope.$emit('ITEM_UPDATED', $scope.driver);
            }, function (err) {
                alert('Error');
            });
        };

        function cancelEditing() {
            $scope.driver.$rollback(true);
            $scope.displayMode = 'VIEW';
        };

        function alreadySelected(tag) {
            var currentTagIds = $scope.driver.Tags.map(function (t) { return t.Id });

            return currentTagIds.indexOf(tag.Id) == -1
        }
    }
}(angular));