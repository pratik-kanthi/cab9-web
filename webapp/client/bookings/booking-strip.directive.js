(function() {
    var module = angular.module('cab9.client.bookings');

    module.controller('BookingDestinationStopModal', bookingDestinationStopModal);
    module.directive('bookingStrip', function() {
        return {
            restrict: 'E',
            templateUrl: '/webapp/client/bookings/booking-strip.template.html',
            scope: {
                booking: '=',
                drivers: '=',
                vehicles: '=',
                onCompleted: '&'
            },
            controller: bookingStripController,
            link: function(scope, element, attrs) {
                scope.$expanded = false;
            }
        }
    });

    bookingStripController.$inject = ['$scope', '$rootScope', '$modal', '$UI', '$config', '$http', 'Model', 'Localisation', '$permissions', 'Notification'];

    function bookingStripController($scope, $rootScope, $modal, $UI, $config, $http, Model, Localisation, $permissions, Notification) {
        $scope.isAdmin = $rootScope.PERMISSIONS.role.Name.toLowerCase() == 'super admin';

        $scope.closeBooking = closeBooking;
        $scope.expandBooking = expandBooking;
        $scope.checkCancelBooking = checkCancelBooking;
        $scope.showCancelButton = showCancelButton;

        $scope.tab = {
            current: 'Info'
        };

        if (moment($scope.booking.BookedDateTime).diff(moment(), "hours") < 2)
            $scope.BS = "COA";
        else
            $scope.BS = "Cancelled";

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
            "Driver Unallocated": "person_pin",
            "Booking Offered To Driver": "person_pin",
            "Booking Pre Allocated To Driver": "person_pin",
            "Booking Patched": "assignment",
            "Booking Edited": "assignment",
            "DriverPaymentIssued": "account_balance_wallet",
            "DriverPaymentCancelled": "account_balance_wallet",
            "ClientInvoiceIssued": "check_circle",
            "ClientInvoiceCancelled": "check_circle",
            "Flight Update": "flight_land",
            "Repricing": "border_color",
            "Booking Sent to Bidding Portal": "assignment",
            "Booking Removed from Bidding Portal": "assignment",
            "Driver Bidded for Booking": "person_pin"
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
            "Driver Unallocated": "green-bg",
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
            "Repricing": "orange-bg",
            "Booking Sent to Bidding Portal": "green-bg",
            "Booking Removed from Bidding Portal": "green-bg",
            "Driver Bidded for Booking": "green-bg"
        }

        $scope.PERMISSIONS = $permissions;
        var current = Localisation.currency().getCurrent();

        if ($scope.booking.Client) {
            $scope.CurrencyId = $scope.booking.Client.DefaultCurrencyId;
        } else
            $scope.CurrencyId = current.Id;

        $scope.assignDriver = function(booking, driver) {
            booking.DriverId = driver.Id;
            booking.VehicleId = driver.DefaultVehicleId;
            booking.$patch(true).then(function() {
                booking.$commit(true);

            });
        }
        $scope.loading = false;

        $scope.$watch('booking.$expanded', function(newvalue) {
            if ($scope.booking.$expanded) {
                $scope.loading = true;
                Model.Booking.query().select('Id,BookingExpense/Amount,BookingExpense/BookingExpenseType/Name,BookingValidations/Value,BookingValidations/ClientReference/ReferenceName,BookingRequirements/Name').include('BookingExpense,BookingExpense/BookingExpenseType,BookingValidations,BookingValidations/ClientReference,BookingRequirements').filter("Id eq guid'" + $scope.booking.Id + "'").execute().then(function(response) {
                    $scope.booking.$WaitTime = 0;
                    $scope.booking.BookingValidations = response[0].BookingValidations;
                    $scope.booking.BookingExpense = response[0].BookingExpense;
                    $scope.booking.BookingRequirements = response[0].BookingRequirements;
                    $scope.booking.BookingStops.map(function(item) {
                        $scope.booking.$WaitTime += item.WaitTime;
                    });
                    $scope.loading = false;
                }, function(err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                });
            }
        })

        $scope.trackBooking = function(booking) {
            $http({
                method: 'GET',
                url: window.endpoint + 'api/bookingcodes?bookingid=' + booking.Id
            }).then(function successCallback(response) {
                if (response.data && response.data.Code) {
                    window.open('/track#?b=' + response.data.Code, '_blank', 'height=870,width=1000,left=0,top=0');
                } else {
                    swal({
                        title: "Tracking Not Available.",
                        text: "The tracking information for this booking is not yet available.",
                        type: "warning",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                }
            }, function errorCallback(response) {});
        }

        $scope.updateBookingStatus = function updateBookingStatus(b, status) {
            var booking = new Model.Booking(b);
            var _warText = "";
            b.$updating = true;
            if (b.DriverPaymentId || b.InvoiceId) {
                swal("Warning", "Booking status cannot be modified as the booking is Invoiced/Driver Paid", "warning");
                b.$updating = false;
                return;
            }

            if (status == "Cancelled") {
                _warText = "The Booking will be cancelled and not billed to client."
            } else if (status == "COA") {
                // _warText = "The Booking will be marked COA and client may be billed a minimum amount."
                _warText = "You are cancelling the booking after the cut off time. A cancellation fee will be levied."
            }

            swal({
                title: "Are you sure?",
                text: _warText,
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function() {
                booking.BookingStatus = status;
                booking.$patch(true).then(function() {
                    b.$updating = false;
                    booking.$commit(true);
                });
            });
        }


        $scope.assignVehicle = function(booking, vehicle) {
            booking.$driverUpdate = true;
            booking.VehicleId = vehicle.Id
            booking.$patch(true).then(function() {
                booking.Vehicle = vehicle;
                booking.$commit(true);
                booking.$driverUpdate = false;
            });
        }

        $scope.removeDriver = function(booking) {
            booking.$driverUpdate = true;
            booking.DriverId = null;
            booking.VehicleId = null;
            booking.$patch(true).then(function() {
                booking.Driver = null;
                booking.$commit(true);
                booking.$driverUpdate = false;
            });
        }

        $scope.removeVehicle = function(booking) {
            booking.VehicleId = null;
            booking.$patch(true).then(function() {
                booking.Vehicle = null;
                booking.$commit(true);
            });
        }

        $scope.toggleComplete = function(booking, $event) {
            if (booking.BookingStatus == 'Completed') {
                booking.BookingStatus = 'Allocated';
                $($event.target).removeClass('animated tada');
            } else {
                booking.BookingStatus = 'Completed';
                $($event.target).addClass('animated tada');
            }
            booking.$patch(true).then(function() {
                Notification.success('Booking Saved');
                setTimeout(function() {
                    $scope.onCompleted();
                    // $state.go('root.bookings', null, { reload: true });
                }, 1000)
            });
        }

        function expandBooking(booking) {
            booking.$expanded = true;
            var stops = [];
            stops.push("(EntityType eq 'Booking' and EntityId eq guid'" + booking.Id + "')")
            stops.push("(BookingId eq guid'" + booking.Id + "')")
            for (var i = 0; i < booking.BookingStops.length; i++) {
                var s = booking.BookingStops[i];
                stops.push("(EntityType eq 'BookingStop' and EntityId eq guid'" + s.Id + "')")
            }

            fetchFinanceTransaction(booking);

            $http.get($config.API_ENDPOINT + 'api/bookings/ClientHistory', {
                params: {
                    bookingId: booking.Id
                }
            }).then(function(response) {
                $scope.history = {};
                if (response.data.length == 0) {
                    $scope.noHistory = true;
                }
                angular.forEach(response.data, function(item) {
                    var x = new Model.AuditRecord(item);
                    var date = moment(x.Timestamp).format('DD MMM');
                    if (!$scope.history[date]) {
                        $scope.history[date] = [];
                    }
                    $scope.history[date].push(x);
                });
            });
        }

        function showCancelButton(bookingStatus) {
            var statuses = ['Incoming', 'OpenToBid', 'PreAllocated', 'Allocated', 'OnRoute', 'Arrived'];
            if(statuses.indexOf(bookingStatus) > -1) {
                return true;
            } else {
                return false;
            }
        }

        function checkCancelBooking(bookingId) {

            $http.get($config.API_ENDPOINT + 'api/client/check-booking-cancellation', {
                params: {
                    bookingId: bookingId,
                }
            }).success(function(data) {

                if (data && data.COA == true) {
                    swal({
                        title: "Charged Cancellation",
                        text: "This cancellation will be charged based on the cancellation policies set on your account.",
                        type: 'warning',
                        showCancelButton: true,
                        closeOnConfirm: false
                    }, function() {
                        cancelBooking(bookingId);
                    });
                } else {
                    swal({
                        title: "Are you sure?",
                        text: "The booking will be cancelled.",
                        type: 'warning',
                        showCancelButton: true,
                        closeOnConfirm: false
                    }, function() {
                        cancelBooking(bookingId);
                    });
                }
            });
        }

        function cancelBooking(bookingId) {
            
            $http.get($config.API_ENDPOINT + 'api/client/cancel-booking',{
                params: {
                    bookingId: bookingId,
                }
            }).success(function() {
                swal('Cancelled', 'Booking has been cancelled.', 'success'); 
            }).error(function() {
                swal('Cancellation Error', 'There was an error cancelling the booking.', 'error'); 
            });
        }


        function fetchFinanceTransaction(booking) {
            $scope.fetchingFinance = true;
            $http.get($config.API_ENDPOINT + 'api/bookings/getbookingfinancedetails', {
                params: {
                    bookingId: booking.Id,
                }
            }).success(function(data) {
                booking.$FinanceInfo = data;
                $scope.fetchingFinance = false;
            });
        }

        function closeBooking(booking) {
            booking.$expanded = false;
            if ($scope.history) {
                $scope.history = null;
            }
        }

        $scope.getLocation = function(booking) {
            var waypts = [];

            var directionsService = new google.maps.DirectionsService();
            var request = {
                origin: booking._FromSummary,
                destination: booking._ToSummary,
                waypoints: waypts,
                optimizeWaypoints: true,
                travelMode: google.maps.TravelMode.DRIVING
            };

            directionsService.route(request, function(res, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    staticMapUrl = encodeURI($config.GMAPS_STATIC_URL + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-start@2x.png|" + booking._FromSummary + "&markers=shadow:false|scale:2|icon:http://d1a3f4spazzrp4.cloudfront.net/receipt-new/marker-finish@2x.png|" + booking._ToSummary + "&path=weight:5|color:0x2dbae4ff|enc:" + res.routes[0].overview_polyline);
                    $scope.booking.mapUrl = staticMapUrl;
                }
                $scope.$apply();
            });

        }

        $scope.openEditModal = function(booking, repeat) {
            if (repeat) {
                window.open('/webapp/client/bookings/modals/reuse-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId + '&repeat=true', '_blank', 'height=870,width=1000,left=0,top=0');
            } else {
                var test = new moment().add(2, 'hours');
                if (booking.BookingStatus != 'Incoming') {
                    message = "";
                    switch (booking.BookingStatus) {
                        case 'COA':
                        case 'Cancelled':
                            message = "This booking has already been marked as cancelled";
                            break;
                        case 'Allocated':
                        case 'PreAllocated':
                            message = "This booking has already been allocated";
                            break;
                        case 'Completed':
                            message = "This booking has already been completed";
                            break;
                        default:
                            message = "This booking is already in progress";
                            break;
                    }

                    swal("Error", message + ", editing is no longer available. Please contact office if you need to make any further amendments.", 'error');
                } else if (test.isAfter(booking.BookedDateTime)) {
                    swal("Error", "This booking is due in less then 2 hours, editing is no longer available. Please contact office if you need to make any further amendments.", 'error');
                } else {
                    window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&mode=Client&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=870,width=1000,left=0,top=0');
                }
            }
        }


        $scope.reUse = function(booking) {
            window.open('/webapp/common/modals/bookings/reuse-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, '_blank', 'height=870,width=1000,left=0,top=0');

        }
        $scope.emailTo = function(type, booking) {
            var modalIns = $modal.open({
                templateUrl: '/webapp/common/modals/email-to.modal.html',
                controller: ['$scope', 'emailAddress', '$modalInstance', function($scope, emailAddress, $modalInstance) {
                    if (emailAddress != null)
                        $scope.email = emailAddress;

                    $scope.sendEmail = function() {
                        $modalInstance.close($scope.email);
                    }
                }],
                resolve: {
                    emailAddress: function() {
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

            modalIns.result.then(function(res) {
                if (res != null) {
                    swal('Success', 'User will receive the email soon..', 'success');
                    if (type == "DRIVER") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "DriverConfirmation",
                            BookingId: booking.Id,
                            DriverId: booking.DriverId,
                            EmailId: res
                        }).success(function() {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "PAX") {
                        $http.post($config.API_ENDPOINT + 'api/email', {
                            Type: "PassengerConfirmation",
                            BookingId: booking.Id,
                            PassengerId: booking.LeadPassengerId,
                            EmailId: res
                        }).success(function() {
                            Notification.success('Email Sent');
                        })
                    } else if (type == "CLIENT") {
                        $http.get($config.API_ENDPOINT + 'api/email/booking', {
                            params: {
                                bookingId: booking.Id,
                                email: res
                            }
                        }, function() {
                            Notification.success('Email Sent');
                        });
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
            editDestination: function(d, a) {
                this.toggle = true;
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/management/bookings/stop-edit.modal.html',
                    controller: 'BookingDestinationStopModal',
                    resolve: {
                        dropOffLoc: function() {
                            if (d)
                                return $scope.booking._ToSummary;
                        }
                    }
                });

                modalInstance.result.finally(function() {
                    stopEdit.toggle = false;
                });

                modalInstance.result.then(function(result) {
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

        $scope.stopSummary = function(stop) {
            return stop.Address1 + ' ' + stop.Area + ', ' + stop.TownCity + ', ' + stop.Postcode;
        }

        $scope.editing = {
            any: function() {
                return (this.expenses.toggle || this.waiting.toggle || this.notes.toggle || this.stops.toggle);
            },
            expenses: angular.copy(partEditingTemplate),
            waiting: angular.copy(partEditingTemplate),
            notes: angular.copy(partEditingTemplate),
            stops: stopEdit
        };

        $scope.showConversations = showConversations;

        function showConversations(booking, type) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/views/conversations/conversations-list.partial.html',
                controller: 'ConversationsModalController',
                windowClass: 'chat',
                backdropClass: 'chatBG',
                resolve: {
                    rBooking: function() {
                        return booking;
                    },
                    rType: function() {
                        return type;
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
            }, function(results, status) {
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

        $scope.$watch('choosen', function(newvalue) {
            if (newvalue && angular.isObject(newvalue) && newvalue.geometry) {
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

        $scope.confirmDestination = function() {
            var newLoc = {};
            angular.forEach($scope.choosen.address_components, function(comp) {
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
            if ($scope.choosen.types.filter(function(t) {
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
