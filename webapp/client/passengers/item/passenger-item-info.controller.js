(function (angular) {
    var module = angular.module('cab9.client.passengers');

    module.controller('PassengerItemInfoController', passengerItemInfoController);

    passengerItemInfoController.$inject = ['$scope', '$state', '$q', 'Model', 'ImageUpload', 'rData', 'rPassengerTags', '$UI', '$config'];

    function passengerItemInfoController($scope, $state, $q, Model, ImageUpload, rData, rPassengerTags, $UI, $config) {
        $scope.passenger = rData[0];
        $scope.passengerTags = rPassengerTags;
        $scope.viewMode = 'VIEW';
        for (var i = 0; i < $scope.passenger.PassengerTags.length; i++) {
            var req = $scope.passenger.PassengerTags[i];
            var found = $scope.passengerTags.filter(function (dr) {
                return dr.Id == req.Id;
            });
            if (found.length == 1) {
                $scope.passenger.PassengerTags[i] = found[0];
            }
        }

        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;

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
            $scope.passenger.$patch().then(function (response) {
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
    }
})(angular);