(function () {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingModalController', DispatchBookingModalController);

    DispatchBookingModalController.$inject = ['$scope', 'rBooking', 'rWarning', '$config', 'Model', '$http'];

    function DispatchBookingModalController($scope, rBooking, rWarning, $config, Model, $http) {
        $scope.b = rBooking;
        $scope.warning = rWarning;
        $scope.activeTab = 'Info';
        $scope.fetchingHistory = false;
        $scope.history = null;
        $scope.noHistory = false;
        $scope.noMoreHistory = false;
        $scope.historyPage = 1;
        $scope.activateTab = activateTab;
        $scope.fetchMoreHistory = fetchMoreHistory;
        $scope.b.BookingStops = $scope.b.BookingStops.sort(function (a, b) {
            return a.StopOrder - b.StopOrder;
        });
        $scope.iconsIndex = {
            "N/A": "assignment",
            "Booking Offer Sent": "assignment",
            "Booking Created": "assignment",
            "Booking Cancelled": "assignment",
            "FlightTrackingStarted": "flight_land",
            "FlightTrackingStopped": "flight_land",
            "SMS Confirmation": "insert_comment",
            "Email Client Confirmation": "email",
            "Email Booker Confirmation": "email",
            "SMS Driver Arrived": "insert_comment",
            "Call Driver Arrived": "phone",
            "Email Manual Confirmation": "email",
            "Driver Read Offer": "person_pin",
            "Driver Accepted": "person_pin",
            "Driver Rejected": "person_pin",
            "Driver Allocated": "person_pin",
            "Booking Offered To Driver": "person_pin",
            "Booking Pre Allocated To Driver": "person_pin",
            "Booking Patched": "assignment",
            "Booking Edited": "assignment",
            "DriverPaymentIssued": "account_balance_wallet",
            "DriverPaymentCancelled": "account_balance_wallet",
            "ClientInvoiceIssued": "check_circle",
            "ClientInvoiceCancelled": "check_circle",
            "Flight Update": "flight_land",
            "Repricing": "border_color"
        }

        $scope.coloursIndex = {
            "N/A": "orange-bg",
            "Booking Offer Sent": "green-bg",
            "Booking Created": "green-bg",
            "FlightTrackingStarted": "green-bg",
            "FlightTrackingStopped": "red-bg",
            "SMS Confirmation": "green-bg",
            "Email Client Confirmation": "green-bg",
            "Email Booker Confirmation": "green-bg",
            "SMS Driver Arrived": "green-bg",
            "Call Driver Arrived": "green-bg",
            "Email Manual Confirmation": "orange-bg",
            "Driver Read Offer": "green-bg",
            "Driver Accepted": "green-bg",
            "Driver Rejected": "orange-bg",
            "Driver Allocated": "green-bg",
            "Booking Offered To Driver": "green-bg",
            "Booking Pre Allocated To Driver": "green-bg",
            "Booking Patched": "orange-bg",
            "Booking Edited": "orange-bg",
            "DriverPaymentIssued": "green-bg",
            "DriverPaymentCancelled": "red-bg",
            "ClientInvoiceIssued": "green-bg",
            "ClientInvoiceCancelled": "red-bg",
            "Booking Cancelled": "red-bg",
            "Flight Update": "orange-bg",
            "Repricing": "orange-bg"
        }
        $scope.BS = [
            "OnRoute",
            "Arrived",
            "InProgress",
            "Completed",
            "Cancelled",
            "COA",
            "OpenToBid"
        ];
        $scope.$on('SIGNALR_updateBooking', onUpdateBooking);

        function activateTab(tab) {
            $scope.activeTab = tab;
            if ($scope.activeTab == 'History' && !$scope.history) {
                fetchHistoryPage(1, $scope.b)
            }
        }

        function fetchMoreHistory() {
            $scope.historyPage++;
            fetchHistoryPage($scope.historyPage, $scope.b);
        }

        function fetchHistoryPage(page, booking) {
            if (!$scope.history)
                $scope.history = {};
            var top = 10;
            var skip = (page - 1) * top;
            $scope.fetchingHistory = true;
            $http.get($config.API_ENDPOINT + 'api/Audit/ForBooking', {
                params: {
                    bookingId: booking.Id,
                    top: top,
                    skip: skip
                }
            }).success(function (data) {
                $scope.fetchingHistory = false;
                if (page == 1 && data.length == 0) {
                    $scope.noHistory = true;

                }
                if (data.length < top || data[data.length - 1].BookingEvent == 'Booking Created') {
                    $scope.noMoreHistory = true;
                }
                angular.forEach(data, function (x) {
                    var date = moment(x.Timestamp).format('DD MMM');
                    if (!$scope.history[date]) {
                        $scope.history[date] = [];
                    }
                    $scope.history[date].push(new Model.AuditRecord(x));
                });
            }, function (err) {
                swal("Payment Error", "Error fetching history", "error");
                $scope.fetchingHistory = false;
            });
        }

        function onUpdateBooking(event, args) {
            var update = args[0];
            if (update.Id == $scope.b.Id) {
                $scope.b = new Model.Booking(angular.extend({}, $scope.b, update));

                $scope.b.BookingStops = $scope.b.BookingStops.sort(function (a, b) {
                    return a.StopOrder - b.StopOrder;
                });

                $scope.b.$pre = $scope.isPreBooking($scope.b);
                if ($scope.b.BookingStatus == "OnRoute") {
                    $scope.b.$eta = "ETA: Calculating...";
                    $scope.b.$etaDesc = "Calculating ETA to Pickup";
                }
                if ($scope.b.BookingStatus == "InProgress") {
                    $scope.b.$eta = "ETA: Calculating...";
                    $scope.b.$etaDesc = "Calculating ETA to DropOff";
                }
            }
            console.log('onUpdateBookingOfferModel - $scope.$apply');
            $scope.$apply();

        }
    }
}())