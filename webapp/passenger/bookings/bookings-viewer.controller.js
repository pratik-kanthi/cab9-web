(function () {
    var module = angular.module('cab9.passenger.bookings');

    module.controller('BookingsViewerController', BookingsViewerController);

    BookingsViewerController.$inject = ['$scope', 'rBooking', 'rTabs', '$config'];
    function BookingsViewerController($scope, rBooking, rTabs, $config) {
        $scope.booking = rBooking;
        $scope.tabDefs = rTabs;

        $scope.accessors = {
            LogoUrl: function () {
                return $scope.booking._ImageUrl;
            }
        };
    }
}());