(function(angular) {
    var module = angular.module('cab9.common');

    module.controller('BookingDriverPaymentCalculationController', bookingDriverPaymentCalculationController);

    bookingDriverPaymentCalculationController.$inject = ['$scope', '$http', 'rBooking'];

    function bookingDriverPaymentCalculationController($scope, $http, rBooking) {
        $scope.item = rBooking;
        $scope.fetchingBreakdown = true;
        $http.get($config.API_ENDPOINT + 'api/driverpayments/breakdown?bookingId=' + $scope.item.Booking.Id).then(function(response) {
            $scope.fetchingBreakdown = false;
            $scope.item.$breakDown = response.data;
            if ($scope.item.$breakDown.PaymentModelUsed.Type == 'Mileage') {
                $scope.item.$breakDown.$totalCommission = 0;
                for (i = 0, len = $scope.item.$breakDown.Workings.length; i < len; i++)
                    $scope.item.$breakDown.$totalCommission += $scope.item.$breakDown.Workings[i].Cost;

            }
        }, function(err) {
            $scope.fetchingBreakdown = false;
            $scope.error = err;
        })
    }
}(angular));
