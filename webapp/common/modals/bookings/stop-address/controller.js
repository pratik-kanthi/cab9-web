(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('BookingStopEditModalController', bookingStopEditModalController);

    bookingStopEditModalController.$inject = ['$scope', '$UI', '$q', '$modal', '$modalInstance', 'rStop'];

    function bookingStopEditModalController($scope, $UI, $q, $modal, $modalInstance, rStop) {
        $scope.stop = rStop;
        $scope.update = update;

        function update() {
            var add = '';
            if ($scope.stop.Address1 && $scope.stop.Address1.length > 1) {
                add += $scope.stop.Address1;
            }
            if ($scope.stop.Address2 && $scope.stop.Address2.length > 1) {
                add += ', ' + $scope.stop.Address2;
            }
            if ($scope.stop.TownCity) {
                if (add.length > 0) {
                    add += ', ';
                }
                add += $scope.stop.TownCity;
            } else if ($scope.stop.Area) {
                if (add.length > 0) {
                    add += ', ';
                }
                add += $scope.stop.Area;
            }
            if ($scope.stop.Postcode) {
                if (add.length > 0) {
                    add += ', ';
                }
                add += $scope.stop.Postcode;
            }
            $scope.stop.StopSummary = add;
            $modalInstance.close($scope.stop);
        }
    }
}(angular));