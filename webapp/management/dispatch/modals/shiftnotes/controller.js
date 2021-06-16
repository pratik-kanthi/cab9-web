(function() {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchDriverNotesController', dispatchDriverNotesController);

    dispatchDriverNotesController.$inject = ['$scope', '$modalInstance', 'rShiftId', 'rShiftNotes', '$http'];

    function dispatchDriverNotesController($scope, $modalInstance, rShiftId, rShiftNotes, $http) {
        $scope.shiftId = rShiftId;
        $scope.shiftNotes = rShiftNotes;
        $scope.saveNotes = saveNotes;

        function saveNotes() {
            $http({
                method: 'PUT',
                url: $config.API_ENDPOINT + 'api/DriverShift/AddNotesToDriverShift?shiftId=' + $scope.shiftId + '&notes=' + $scope.shiftNotes
            }).then(function successCallback(response) {
                swal({
                    title: "Notes Saved",
                    text: "Driver shift notes have been saved.",
                    type: "success",
                });
                $modalInstance.close($scope.shiftNotes);
            }, function errorCallback(error) {
                swal({
                    title: "Error",
                    text: error.data.ExceptionMessage || "There was an error saving driver shift notes.",
                    type: "error",
                });
            });
        }
    }
})();