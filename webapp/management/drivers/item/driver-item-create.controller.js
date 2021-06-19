(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverItemCreateController', driverItemCreateController);

    driverItemCreateController.$inject = ['$scope', '$state', 'Model', 'rDriverTypes', 'rDriverTags', '$UI', '$q', 'rPaymentModels'];

    function driverItemCreateController($scope, $state, Model, rDriverTypes, rDriverTags, $UI, $q, rPaymentModels) {
        $scope.driverTypes = rDriverTypes;
        $scope.driver = new Model.Driver();
        $scope.displayMode = "CREATE";
        $scope.driverTags = rDriverTags;
        $scope.paymentModels = rPaymentModels;

        $scope.driver.Tags = [];

        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function saveEdits() {
            $scope.saving = true;
            var promises = [];

            angular.forEach($scope.driver.Tags, function (add) {
                promises.push(Model.$associate("Driver", "DriverTags", $scope.driver.Id, add.Id));
            });

            promises.push($scope.driver.$save());

            $q.all(promises).then(function (response) {

                    swal({
                        title: "Driver Saved.",
                        text: "New Driver has been added.",
                        type: "success",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                    $state.go('root.drivers.viewer.dashboard', {
                        Id: response[0].data.Id
                    });
                },
                function () {
                    alert('Error');
                    console.log(arguments);
                });
        }

        function cancelEditing() {
            $state.go('root.drivers.cards');
        }

    }
})(angular);