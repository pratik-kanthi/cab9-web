(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchUnconfirmedBookingController', DispatchUnconfirmedBookingController);

    DispatchUnconfirmedBookingController.$inject = ['$scope', '$http', '$config', 'Model', '$timeout', '$filter', '$interval', '$modal'];

    function DispatchUnconfirmedBookingController($scope, $http, $config, Model, $timeout, $filter, $interval, $modal) {
        $scope.dispatchObj.unconfirmed = {
            // all the booking for the selected filters
            items: [],

            formatBookings: formatBookings,

            // function to select a booking. pass selectBooking(null) to clear the selected booking
            selectBooking: selectBooking,

            //refetchs the bookings based on current filter options
            refetchBookings: refetchBookings,

            showHistory: showHistory,
            acceptBooking: acceptBooking,
            rejectBooking: rejectBooking
        };
        $scope.fetching = true;

        $scope.manageKeyPress = manageKeyPress;

        $scope.today = new moment().format("DD/MM/YYYY");

        $scope.acceptBooking = acceptBooking;
        $scope.rejectBooking = rejectBooking;

        $timeout(function () {
            refetchBookings();
        }, 0);


        function formatBookings(bookings) {
            if (bookings.length > 0) {
                for (var i = 0; i < bookings.length; i++) {
                    var booking = bookings[i];
                    var minutes = moment(booking.BookedDateTime).diff(moment(), "minutes");
                    if (minutes > 180)
                        booking.$countdown = (minutes / 60).toFixed(2) + " hours";
                    else if (minutes >= 0) {
                        if (minutes == 1)
                            booking.$countdown = minutes + " min";
                        else
                            booking.$countdown = minutes + " mins";
                    } else {
                        if (minutes < -180)
                            booking.$countdown = (Math.abs(minutes) / 60).toFixed(2) + " hours ago";
                        else {
                            if (minutes == -1)
                                booking.$countdown = Math.abs(minutes) + " min ago";
                            else
                                booking.$countdown = Math.abs(minutes) + " mins ago";
                        }
                    }
                    if (booking.OneTransportStatus != 'Accepted' && booking.OneTransportStatus != 'AutoAccepted') {
                        var seconds = moment(booking.OneTransportReceived).add(90, 'seconds').diff(moment(), "seconds");
                        booking.$countup = seconds + " secs";
                    }

                    booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                    for (var j = 0; j < booking.BookingStops.length; j++) {
                        booking.BookingStops[j] = new Model.BookingStop(booking.BookingStops[j]);
                    }

                    if (booking.OneTransportStatus == 'Accepted' || booking.OneTransportStatus == 'AutoAccepted' || seconds > 0) {
                        $scope.dispatchObj.unconfirmed.items.push(booking);
                    }
                }
            }
        }

        $scope.$on('SIGNALR_bookingResponded', function (event, args) {
            var _update = args[0];
            var index = null;
            angular.forEach($scope.dispatchObj.unconfirmed.items, function (booking, i) {
                if (booking.Id == _update) {
                    index = i;
                    return true;
                }
            });
            if (index != null) {
                $scope.dispatchObj.unconfirmed.items.splice(index, 1);
            }
            $scope.$apply();
        });

        function acceptBooking(b) {
            var booking = new Model.Booking(b);
            if (booking.BookingSource == 'WORKSHARE') {
                b.$loading = true
                $scope.dispatchObj.bookings.reload++
                $http.put($config.API_ENDPOINT + "api/partners/booking/accept?bookingId=" + b.Id)
                    .success(function () {
                        b.$loading = false
                        $scope.dispatchObj.bookings.reload++;
                        addHistory("Booking Accepted", "SUCCESS");
                        refetchBookings();
                    })
                    .error(function () {
                        b.$loading = false
                        $scope.dispatchObj.bookings.reload++;
                        addHistory("Booking Accept Failed", "FAIL");
                        refetchBookings();
                    });
            } else if (booking.OneTransportReference) {
                $http.post($config.API_ENDPOINT + "api/OneTransport/Accept?BookingId=" + b.Id)
                    .success(function () {
                        addHistory("Booking Accepted", "SUCCESS");
                        refetchBookings();
                    })
                    .error(function () {
                        addHistory("Booking Accept Failed", "FAIL");
                        refetchBookings();
                    });
            } else if (booking.CityFleetReference) {
                $http.post($config.API_ENDPOINT + "api/CityFleet/Accept?BookingId=" + b.Id)
                    .success(function () {
                        addHistory("Booking Accepted", "SUCCESS");
                        refetchBookings();
                    })
                    .error(function () {
                        addHistory("Booking Accept Failed", "FAIL");
                        refetchBookings();
                    });
            }
        }

        function showHistory(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=850,width=1000,left=0,top=0');
        }

        function rejectBooking(b) {
            var booking = new Model.Booking(b);
            swal({
                title: "Are you sure?",
                text: "Booking will be handed back.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function () {
                //booking.BookingStatus = "Rejected";
                //booking.$patch(true).then(function () {
                //    booking.$commit(true);
                //});
                if (booking.BookingSource == 'WORKSHARE') {
                    b.$loading = true;
                    $scope.dispatchObj.bookings.reload++;
                    $http.put($config.API_ENDPOINT + "api/partners/booking/reject?bookingId=" + b.Id)
                        .success(function () {
                            b.$loading = false;
                            $scope.dispatchObj.bookings.reload++;
                            addHistory("Booking Rejected", "SUCCESS");
                            refetchBookings();
                        })
                        .error(function () {
                            b.$loading = false;
                            $scope.dispatchObj.bookings.reload++;
                            addHistory("Booking Reject Failed", "FAIL");
                            refetchBookings();
                        });
                } else if (booking.OneTransportReference) {
                    $http.post($config.API_ENDPOINT + "api/OneTransport/Reject?BookingId=" + b.Id)
                        .success(function () {
                            addHistory("Booking Rejected", "SUCCESS");
                            refetchBookings();
                        })
                        .error(function () {
                            addHistory("Booking Reject Failed", "FAIL");
                            refetchBookings();
                        });
                } else if (booking.CityFleetReference) {
                    $http.post($config.API_ENDPOINT + "api/CityFleet/Reject?BookingId=" + b.Id)
                        .success(function () {
                            addHistory("Booking Rejected", "SUCCESS");
                            refetchBookings();
                        })
                        .error(function () {
                            addHistory("Booking Reject Failed", "FAIL");
                            refetchBookings();
                        });
                }
            });
        }

        $scope.$watch('SIGNALR.status', function (newvalue, oldvalue) {
            if (newvalue == 4 && newvalue != oldvalue) {
                //refetchBookings();
            }
        });

        function addHistory(msg, status) {
            $scope.dispatchObj.history.unshift({
                status: status || 'info',
                text: msg,
                time: new moment().format('HH:mm:ss')
            });
            $scope.dispatchObj.history.length = Math.min($scope.dispatchObj.history.length, 30);
        }

        function refetchBookings() {
            $scope.fetching = true;
            //addHistory("Fetching Bookings", "info");
            Model.Booking
                .query()
                .include('BookingStops,FlightInfo,Client,ClientStaff,LeadPassenger,Driver,Vehicle,VehicleType,Currency')
                .select('Id,LocalId,DriverId,ClientId,ClientStaffId,Reference,BookingStatus,DriverNotes,PassengerNotificationPhone,EstimatedDistance,PassengerNotes,HasEdits,OfficeNotes,BookingSource,CreationTime,VehicleId,LeadPassengerId,Currency,CurrencyRate,Tax,ActualCost,BookedDateTime,ImageUrl,Pax,Bax,BookingExpense,' +
                    'Driver/Firstname,Driver/Surname,Driver/Callsign,Driver/ImageUrl,Driver/Mobile,' +
                    'Client/Name,Client/AccountNo,Client/ImageUrl,Client/Phone,' +
                    'ClientStaff/Firstname,ClientStaff/Surname,ClientStaff/ImageUrl,ClientStaff/Phone,' +
                    'Vehicle/Class,Vehicle/Registration,Vehicle/Colour,Vehicle/Make,Vehicle/Model,VehicleType/Name,' +
                    'FlightInfo/FlightNumber,FlightInfo/OriginCode,FlightInfo/Origin,FlightInfo/ArrivalTime,FlightInfo/LastUpdate,FlightInfo/ScheduledArrivalTime,' +
                    'BookingStops/StopSummary,BookingStops/Postcode,BookingStops/WaitTimeChargable,BookingStops/Address1,BookingStops/Latitude,BookingStops/Longitude,' +
                    'LeadPassenger/Firstname,LeadPassenger/Surname,LeadPassenger/Mobile,LeadPassenger/ImageUrl,' +
                    'OneTransportReference,OneTransportReceived,OneTransportStatus')
                .orderBy('BookedDateTime')
                .where("BookingStatus eq 'Unconfirmed'")
                .where("BookedDateTime ge datetimeoffset'" + moment().subtract(1, 'day').format() + "'")
                .execute().then(function (data) {
                    data.map(function (b) {
                        if (b.FlightInfo) {
                            if (moment().diff(moment(b.FlightInfo.LastUpdate), 'hours') > 10) {
                                b.FlightInfo.$Status = "No updates yet."
                            } else {
                                b.FlightInfo.$Status = "Last Updated " + moment(b.FlightInfo.LastUpdate).fromNow();
                            }
                        }
                    })

                    $scope.dispatchObj.unconfirmed.items.length = 0; //needed to clear one time bindings

                    $timeout(function () {
                        //set new data
                        $scope.dispatchObj.unconfirmed.formatBookings(data);
                        $scope.fetching = false;
                        $timeout(function () {
                            _setupKeyPressOnBookings();
                        }, 0);
                    }, 0);
                    //addHistory("Bookings Fetched", "success");
                }, function () {
                    addHistory("OT Fetch Failed", "FAIL");
                });
        }

        function selectBooking(booking) {
            //if (!$scope.dispatchObj.map.selected.bookingId || $scope.dispatchObj.map.selected.bookingId != booking.Id) {
            //    var driver = null;
            //    if (booking && booking.DriverId) {
            //        driver = $scope.dispatchObj.drivers.items.filter(function (ds) {
            //            return ds.Driver.Id == booking.DriverId
            //        })[0];
            //    }
            //    $scope.dispatchObj.map.select(booking, driver);
            //} else {
            //    $scope.dispatchObj.selectedBooking = null;
            //    $scope.dispatchObj.map.select(null, null);
            //}
        }

        function manageKeyPress($event, booking) {
            if ($event.keyCode == '13') {
                $scope.dispatchObj.selectedBooking = booking;
                $scope.dispatchObj.map.drawRoute(booking);
            } else if ($event.keyCode == '27') {
                selectBooking(null);
            }
        }

        function _setupKeyPressOnBookings() {
            $('#unconfirmed .booking').bind('keydown', function (eInner) {
                eInner.preventDefault();
                if (eInner.keyCode == '40') {
                    var tabindex = $(this).attr('tabindex');
                    tabindex++;
                    $('[tabindex=' + tabindex + ']').focus();
                } else if (eInner.keyCode == '38') {
                    var tabindex = $(this).attr('tabindex');
                    tabindex--;
                    $('[tabindex=' + tabindex + ']').focus();
                }
            });
        };
    }
})(angular);