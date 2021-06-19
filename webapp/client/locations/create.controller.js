(function (angular) {
    var module = angular.module('cab9.client.locations');
    module.controller('ClientLocationCreateController', clientLocationCreateController);

    clientLocationCreateController.$inject = ['$scope', 'Model', '$state', '$rootScope'];

    function clientLocationCreateController($scope, Model, $state, $rootScope) {
        $scope.item = new Model.KnownLocation();
        $scope.displayMode = 'CREATE';
        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;

        function saveEdits() {
            $scope.item.StopSummary = window.$utilities.formatAddress($scope.item);
            $scope.item.$save().then(function (result) {
                Model.$associate('Client', 'Location', $rootScope.CLIENTID, result.data.Id).then(function (response) {
                    swal('Success', 'The location saved successfully', 'success');
                    $state.go('root.locations', null, {
                        reload: true
                    });
                }, function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            }, function () {
                swal('Error', 'The location failed to save.', 'error');
            })
        }

        function cancelEditing() {
            $state.go('root.locations');
        }
    }
})(angular);