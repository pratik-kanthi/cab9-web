(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengerItemInfoController', passengerItemInfoController);

    passengerItemInfoController.$inject = ['$scope', '$state', '$q', 'Model', 'ImageUpload', 'rData', 'rClients', 'rPassengerTags', '$UI', '$config', 'rVehicleTypes'];

    function passengerItemInfoController($scope, $state, $q, Model, ImageUpload, rData, rClients, rPassengerTags, $UI, $config, rVehicleTypes) {
        $scope.passenger = rData[0];
        $scope.clients = rClients;
        $scope.passengerTags = rPassengerTags;
        $scope.viewMode = 'VIEW';
        $scope.vehicleTypes = rVehicleTypes.map(function (x) { x.ImageUrl = x._ImageUrl; return x; });
        var originalTags = angular.copy($scope.passenger.Tags);

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;
        $scope.alreadySelected = alreadySelected;

        function chooseImage() {
            ImageUpload.openPicker({
                    type: 'Passenger',
                    id: $scope.passenger.Id,
                    searchTerm: $scope.passenger._Fullname
                })
                .then(function (result) {
                    $scope.passenger.ImageUrl = result;
                    saveEdits();
                }, function (result) {});
        };

        function startEditing() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.passenger.$rollback(true);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            var promises = [];

            if (angular.isDefined($scope.passenger.$$changedValues.Tags)) {
                var changes = originalTags.changes($scope.passenger.$$changedValues.Tags, function (a, b) {
                    return a.Id == b.Id;
                });
                angular.forEach(changes.removed, function (remove) {
                    promises.push(Model.$dissociate("Passenger", "PassengerTags", $scope.passenger.Id, remove.Id));
                });
                angular.forEach(changes.added, function (add) {
                    promises.push(Model.$associate("Passenger", "PassengerTags", $scope.passenger.Id, add.Id));
                });
            }


            promises.push($scope.passenger.$patch());

            $q.all(promises).then(function (response) {
                $state.go($state.current, {
                    Id: $scope.passenger.Id
                }, {
                    reload: true
                })
                swal({
                    title: "Passenger Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }


        function alreadySelected(tag) {
            var currentTagIds = $scope.passenger.Tags.map(function (t) { return t.Id });

            return currentTagIds.indexOf(tag.Id) == -1
        }

    }
})(angular);