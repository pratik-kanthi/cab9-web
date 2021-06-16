(function () {
    var module = angular.module('cab9.driver.bookings');

    module.directive('bookingStrip', function () {
        return {
            restrict: 'E',
            templateUrl: '/webapp/driver/bookings/booking-strip.template.html',
            scope: {
                booking: '='
            },
            controller: bookingStripController,
            link: function (scope, element, attrs) {
                scope.$expanded = false;
            }
        }
    });

    bookingStripController.$inject = ['$scope', '$modal', '$config', '$http', 'Model', 'Notification'];
    function bookingStripController($scope, $modal, $config, $http, Model, Notification) {
        $scope.getLocation = function (booking) {
            var waypts = [];

            var directionsService = new google.maps.DirectionsService();
            var request = {
                origin: booking._FromSummary,
                destination: booking._ToSummary,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, function (res, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    staticMapUrl = encodeURI($config.GMAPS_STATIC_URL + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|" + booking._FromSummary
                                    + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|" + booking._ToSummary + "&path=weight:5|color:0x2dbae4ff|enc:" + res.routes[0].overview_polyline);
                    $scope.booking.mapUrl = staticMapUrl;
                }
                $scope.$apply();
            });

        }

        $scope.emailTo = function (booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/shared/modals/email-to.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function ($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.sendEmail = function () {
                        $modalInstance.close($scope.email);
                    }
                }],
                resolve: {
                    emailAddress: function () {
                        var email = null;
                        email = booking.Driver ? booking.Driver.Email : null;
                        return email;
                    }
                }
            });

            modalIns.result.then(function (res) {
                if (res != null) {
                    swal('You will receive the email soon..');
                    $http.post($config.API_ENDPOINT + 'api/email', {
                        Type: "DriverConfirmation",
                        BookingId: booking.Id,
                        DriverId: booking.DriverId,
                        EmailId: res
                    }).success(function () {
                        Notification.success('Email Sent');
                    })
                }
            });

        }
        
        $scope.stopSummary = function (stop) {
            return stop.Address1 + ' ' + stop.Area + ', ' + stop.TownCity + ', ' + stop.Postcode;
        }
    }
}());