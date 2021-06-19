(function(angular) {
    var module = angular.module('cab9.bookings');

    module.controller('RepeatBookingsController', repeatBookingsController);

    repeatBookingsController.$inject = ['$scope', '$modal', 'Model', '$q', '$http', '$config', '$rootScope', '$compile', '$timeout'];

    function repeatBookingsController($scope, $modal, Model, $q, $http, $config, $rootScope, $compile, $timeout) {

        $scope.repeatBookings = [];
        fetchRepeatBookings();

        $scope.cancelRepeat = cancelRepeat;

        function fetchRepeatBookings() {
            $scope.fetching = true;
            $http.get($config.API_ENDPOINT + 'api/bookings/repeat/')
                .success(function(data) {
                    $scope.fetching = false;
                    $scope.bookings = data;
                    $scope.bookings.map(function(b) {
                        b.$numberOfBookings = b.BookingsAttached.split("|").length;
                        if(moment() < moment(b.CreationTime).add(15, "minutes")) {
                            b.$cancel = true;
                        }
                    })
                }).error(function(error) {
                    $scope.fetching = false;
                    swal("Error Fetching Repeat Bookings", error.Message, "error");
                });
        }

        function cancelRepeat(scheduleId) {
            swal({
                title: "Confirm Cancel",
                text: "Are you sure you want to cancel this repeat booking? This will only effect the future bookings and will not cancel any existing bookings which are Completed or COA.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm",
                showLoaderOnConfirm: true,
                closeOnConfirm: false
            }, function() {
                $http.delete($config.API_ENDPOINT + 'api/bookings/RemoveScheduled?scheduleId=' + scheduleId)
                    .success(function(data) {
                        fetchRepeatBookings();
                        swal("Scheduled Booking Cancelled", "Your request to cancel a scheduled booking is successful. It could take upto 30 mins for all the scheduled bookings to be cancelled.", "success");
                    }).error(function(error) {
                        swal("Error Cancelling Repeat Bookings", error.Message, "error");
                    });
            });

        }

    }
})(angular);
