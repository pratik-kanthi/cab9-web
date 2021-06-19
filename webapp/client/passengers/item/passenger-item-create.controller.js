(function (angular) {
    var module = angular.module('cab9.client.passengers');

    module.controller('PassengerItemCreateController', passengerItemCreateController);

    passengerItemCreateController.$inject = ['$scope', '$state', 'Model', 'rPassengerTags', '$UI', '$q', '$config'];

    function passengerItemCreateController($scope, $state, Model, rPassengerTags, $UI, $q, $config) {
        $scope.passenger = new Model.Passenger();
        $scope.passenger.HomeAddress = {};
        $scope.passenger.WorkAddress = {};
        $scope.passenger.ClientId = $scope.CLIENTID;
        $scope.passengerTags = rPassengerTags;
        $scope.viewMode = "CREATE";
        $scope.passenger.PassengerTags = [];

        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function saveEdits() {
            var promises = [];

            angular.forEach($scope.passenger.PassengerTags, function (add) {
                promises.push(Model.$associate("Passenger", "PassengerTags", $scope.passenger.Id, add.Id));
            });

            promises.push($scope.passenger.$save());

            $q.all(promises).then(function (response) {
                swal({
                    title: "Passenger Saved.",
                    text: "New Passenger has been added.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go('root.passengers.viewer.dashboard', {
                    Id: response[0].data.Id
                });
            }, function () {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                console.log(arguments);
            });
        }

        function cancelEditing() {
            $state.go('root.passengers.cards');
        }
    }
}(angular))