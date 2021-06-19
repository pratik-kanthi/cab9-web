(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchWorkshareController', DispatchWorkshareController);

    DispatchWorkshareController.$inject = [
        '$scope',
        '$http',
        '$config',
        'Model',
        '$timeout',
        '$filter',
        '$interval',
        '$modal',
        'Localisation',
        'Auth'
    ];

    function DispatchWorkshareController($scope, $http, $config, Model, $timeout, $filter, $interval, $modal, Localisation, Auth) {
        $scope.dispatchObj.workshare.refetchBookings = refetchBookings;
        $scope.dispatchObj.workshare.acceptBooking = acceptBooking;
        $scope.dispatchObj.workshare.rejectBooking = rejectBooking;
        $scope.dispatchObj.workshare.items = [];
        $scope.dispatchObj.workshare.bookings = [];
        $scope.fetching = true;

        refetchBookings();

        function refetchBookings() {
            $http.get($config.API_ENDPOINT + 'api/bookings/workshare-bookings').then(function (response) {
                var data = response.data.map(function (x) {
                    var booking = new Model.Booking(x);
                    booking.Summary = booking._JourneySummary;
                    return booking
                });
                $scope.dispatchObj.workshare.bookings.length = 0;
                $scope.dispatchObj.workshare.bookings = $filter('filter')(data, $scope.dispatchObj.bookingSearch);
                $scope.fetching = false;
            }, function () {});
        }

        function acceptBooking(b) {
            b.$loading = true
            $scope.dispatchObj.bookings.reload++
            $http.put($config.API_ENDPOINT + "api/partners/booking/accept?bookingId=" + b.Id)
                .success(function () {
                    b.$loading = false
                    $scope.dispatchObj.bookings.reload++
                    addHistory("Booking Accepted", "SUCCESS");
                    refetchBookings();
                })
                .error(function () {
                    b.$loading = false
                    $scope.dispatchObj.bookings.reload++
                    addHistory("Booking Accept Failed", "FAIL");
                    refetchBookings();
                });
        }

        function rejectBooking(b) {
            swal({
                title: "Are you sure?",
                text: "Booking will be handed back.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function () {
                b.$loading = true;
                $scope.dispatchObj.bookings.reload++
                $http.put($config.API_ENDPOINT + "api/partners/booking/reject?bookingId=" + b.Id)
                    .success(function () {
                        b.$loading = false;
                        $scope.dispatchObj.bookings.reload++
                        addHistory("Booking Rejected", "SUCCESS");
                        refetchBookings();
                    })
                    .error(function () {
                        b.$loading = false;
                        $scope.dispatchObj.bookings.reload++;
                        addHistory("Booking Reject Failed", "FAIL");
                        refetchBookings();
                    });
            });
        }

        function addHistory(msg, status) {
            $scope
                .dispatchObj
                .history
                .unshift({
                    status: status || 'info',
                    text: msg,
                    time: new moment().format('HH:mm:ss')
                });
            $scope.dispatchObj.history.length = Math.min($scope.dispatchObj.history.length, maxHistory);
        }
    }
})(angular);