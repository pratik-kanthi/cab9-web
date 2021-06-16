(function () {
    var module = angular.module('cab9.passenger.bookings');

    module.controller('BookingDestinationStopModal', bookingDestinationStopModal);
    module.directive('bookingStrip', function () {
        return {
            restrict: 'E',
            templateUrl: '/webapp/passenger/bookings/booking-strip.template.html',
            scope: {
                booking: '=',
                drivers: '=',
                vehicles: '=',
                onCompleted: '&'
            },
            controller: bookingStripController,
            link: function (scope, element, attrs) {
                scope.$expanded = false;
            }
        }
    });

    bookingStripController.$inject = ['$scope', '$modal', '$config', '$http', 'Model', 'Localisation', 'Notification'];

    function bookingStripController($scope, $modal, $config, $http, Model, Localisation, Notification) {
        var current = Localisation.currency().getCurrent();
        if ($scope.booking.Client) {
            $scope.CurrencyId = $scope.booking.Client.DefaultCurrencyId;
        } else
            $scope.CurrencyId = current.Id;
        $scope.assignDriver = function (booking, driver) {
            booking.DriverId = driver.Id
            booking.$patch(true).then(function () {
                booking.Driver = driver;
                booking.$commit(true);
            });
        }

        $scope.assignVehicle = function (booking, vehicle) {
            booking.VehicleId = vehicle.Id
            booking.$patch(true).then(function () {
                booking.Vehicle = vehicle;
                booking.$commit(true);
            });
        }

        $scope.removeDriver = function (booking) {
            booking.DriverId = null;
            booking.$patch(true).then(function () {
                booking.Driver = null;
                booking.$commit(true);
            });
        }

        $scope.removeVehicle = function (booking) {
            booking.VehicleId = null;
            booking.$patch(true).then(function () {
                booking.Vehicle = null;
                booking.$commit(true);
            });
        }

        $scope.toggleComplete = function (booking, $event) {
            if (booking.BookingStatus == 'Completed') {
                booking.BookingStatus = 'Allocated';
                $($event.target).removeClass('animated tada');
            } else {
                booking.BookingStatus = 'Completed';
                $($event.target).addClass('animated tada');
            }
            booking.$patch(true).then(function () {
                Notification.success('Booking Saved');
                setTimeout(function () {
                    $scope.onCompleted();
                    // $state.go('root.bookings', null, { reload: true });
                }, 1000)
            });
        }

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
                    staticMapUrl = encodeURI($config.GMAPS_STATIC_URL + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|" + booking._FromSummary + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|" + booking._ToSummary + "&path=weight:5|color:0x2dbae4ff|enc:" + res.routes[0].overview_polyline);
                    $scope.booking.mapUrl = staticMapUrl;
                }
                $scope.$apply();
            });

        }

        $scope.emailTo = function (type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/email-to.modal.html',
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
                        switch (type) {
                        case "DRIVER":
                            email = booking.Driver ? booking.Driver.Email : null;
                            break;
                        case "PAX":
                            email = booking.LeadPassenger ? booking.LeadPassenger.Email : null;
                            break;
                        case "CLIENT":
                            email = booking.Client ? booking.Client.Email : null;
                            break;
                        default:
                            break;
                        }
                        return email;
                    }
                }
            });

            modalIns.result.then(function (res) {
                if (res != null) {
                    swal('Success', 'User will receive the email soon..', 'success');
                    if (type == "DRIVER") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "DriverConfirmation",
                            BookingId: booking.Id,
                            DriverId: booking.DriverId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "PAX") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "PassengerConfirmation",
                            BookingId: booking.Id,
                            PassengerId: booking.LeadPassengerId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "CLIENT") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "ClientConfirmation",
                            BookingId: booking.Id,
                            ClientId: booking.ClientId,
                            EmailId: res
                        }).success(function () {
                            Notification.success('Email Sent');
                        })
                    }
                }
            });

        }

        var partEditingTemplate = {
            toggle: false,
            cancel: function standardCancel() {
                $scope.booking.$rollback();
                this.toggle = false;
            },
            save: function standardSave() {
                $scope.booking.$patch();
                this.toggle = false;
            }
        }
        $scope.API_ENDPOINT = $config.API_ENDPOINT;
        var stopEdit = {
            toggle: false,
            editDestination: function (d, a) {
                this.toggle = true;
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/passenger/bookings/stop-edit.modal.html',
                    controller: 'BookingDestinationStopModal',
                    resolve: {
                        dropOffLoc: function () {
                            if (d)
                                return $scope.booking._ToSummary;
                        }
                    }
                });

                modalInstance.result.finally(function () {
                    stopEdit.toggle = false;
                });

                modalInstance.result.then(function (result) {
                    if (d) {
                        var index = $scope.booking.BookingStops.length - 1;
                        var removed = $scope.booking.BookingStops.splice(index, 1, result);
                        result.Id = removed[0].Id;
                        result.BookingId = $scope.booking.Id;
                        $http({
                            method: 'PATCH',
                            url: $config.API_ENDPOINT + 'api/BookingStops?id=' + result.Id,
                            data: result
                        });
                    } else {
                        result.Type = 'Via';
                        var index = $scope.booking.BookingStops.length - 1;
                        $scope.booking.BookingStops.splice(index, 0, result);
                        result.BookingId = $scope.booking.Id;
                        $http.post($config.API_ENDPOINT + 'api/BookingStops', result);
                    }
                });
            }
        }

        $scope.stopSummary = function (stop) {
            return stop.Address1 + ' ' + stop.Area + ', ' + stop.TownCity + ', ' + stop.Postcode;
        }

        $scope.editing = {
            any: function () {
                return (this.expenses.toggle || this.waiting.toggle || this.notes.toggle || this.stops.toggle);
            },
            expenses: angular.copy(partEditingTemplate),
            waiting: angular.copy(partEditingTemplate),
            notes: angular.copy(partEditingTemplate),
            stops: stopEdit
        };

        $scope.showConversations = showConversations;

        function showConversations(booking) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/conversations/conversations-list.partial.html',
                controller: 'ConversationsModalController',
                windowClass: 'chat',
                backdropClass: 'chatBG',
                resolve: {
                    rBooking: function () {
                        return booking;
                    }
                }
            });
        }
    }

    bookingDestinationStopModal.$inject = ['$scope', '$modalInstance', 'dropOffLoc'];

    function bookingDestinationStopModal($scope, $modalInstance, dropOffLoc) {
        if (dropOffLoc) {
            var geocoder = new google.maps.Geocoder();
            geocoder.geocode({
                'address': dropOffLoc
            }, function (results, status) {
                $scope.choosen = results[0];
            });
        } else
            $scope.choosen = null;

        $scope.destinationValid = false;

        $scope.map = {
            center: {
                latitude: 45,
                longitude: -73
            },
            zoom: 17
        }

        $scope.markers = [];

        $scope.$watch('choosen', function (newvalue) {
            if (newvalue && angular.isObject(newvalue) && newvalue.geometry) {
                console.log(newvalue);
                $scope.destinationValid = true;
                $scope.map.center = {
                    latitude: newvalue.geometry.location.lat(),
                    longitude: newvalue.geometry.location.lng()
                };
                $scope.markers = [{
                    id: '5WnUJbhPEg',
                    coords: {
                        latitude: newvalue.geometry.location.lat(),
                        longitude: newvalue.geometry.location.lng()
                    }
                }];

            } else {
                $scope.destinationValid = false;
            }
        })

        $scope.confirmDestination = function () {
            var newLoc = {};
            angular.forEach($scope.choosen.address_components, function (comp) {
                var type = comp.types[0];
                switch (type) {
                case 'street_number':
                    newLoc.Address2 = comp.long_name;
                    break;
                case 'route':
                    newLoc.Address1 = comp.long_name;
                    break;
                case 'locality':
                    newLoc.Area = comp.long_name;
                    break;
                case 'postal_town':
                    newLoc.TownCity = comp.long_name;
                    break;
                case 'administrative_area_level_2':
                    newLoc.County = comp.long_name;
                    break;
                case 'postal_code':
                    newLoc.Postcode = comp.long_name;
                    break;
                default:
                }
            });
            if ($scope.choosen.types.filter(function (t) {
                    return (t === 'airport' || t === 'transit_station')
                }).length) {
                newLoc.Alias = $scope.choosen.name
            } else {
                newLoc.Alias = $scope.choosen.formatted_address
            }
            try {
                newLoc.Latitude = $scope.choosen.geometry.lat();
                newLoc.Longitude = $scope.choosen.geometry.lng();
            } catch (e) {}

            $modalInstance.close(newLoc);
        }
    }
}());