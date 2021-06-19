(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingsController', DispatchBookingsController);

    DispatchBookingsController.$inject = [
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

    function DispatchBookingsController($scope, $http, $config, Model, $timeout, $filter, $interval, $modal, Localisation, Auth) {
        $scope.dispatchObj.bookings = {
            // all the booking for the selected filters
            items: [],

            formatBookings: formatBookings,

            // function to select a booking. pass selectBooking(null) to clear the selected
            // booking
            selectBooking: selectBooking,
            openBooking: openBooking,
            editBooking: editBooking,
            addToBidQueue: addToBidQueue,
            startBid: startBid,
            confirm: confirm,

            //refetchs the bookings based on current filter options
            refetchBookings: refetchBookings,

            allocateDriver: allocateDriver,

            addExpense: addExpense,

            removeCompleted: removeCompleted,
            removeCancelled: removeCancelled,

            //variable being watched for re-rendering React Booking Component
            reload: 0

        };
        $scope.fetching = true;

        $scope.isPreBooking = isPreBooking;
        $scope.manageKeyPress = manageKeyPress;
        $scope.driverETAs = [];
        $scope.today = new moment().format("DD/MM/YYYY");
        $scope.unallocateBooking = unallocateBooking;
        $scope.updateBookingStatus = updateBookingStatus;
        $scope.completeBooking = completeBooking;
        $scope.cancelBooking = cancelBooking;
        $scope.openEditModal = openEditModal;
        $scope.approveChanges = approveChanges;
        $scope.disabledStatus = disabledStatus;

        $timeout(function () {
            refetchBookings();
        }, 0);
        var historyIndex = 1;
        var maxHistory = 20;
        $scope.history = [];

        var interval = $interval(function () {
            refetchBookings();
            console.log('refetchBookings - $interval');


        }, (60 * 1000));

        window.dispatchCleanup.push(function () {
            $scope.$destroy();
            if (interval) {
                $interval.cancel(interval);
            }
        });

        $scope.BS = [
            "OnRoute",
            "Arrived",
            "InProgress",
            "Completed",
            "Cancelled",
            "COA",
            "OpenToBid"
        ];

        $scope.$on('SIGNALR_sendDriverETA', driverETAReceived);

        // $interval(updateCountup, 1000); function updateCountup() {
        // console.log('updateCountup - $interval');    var indexes = [];
        // angular.forEach($scope.dispatchObj.bookings.items, function (booking, index)
        // {        if (booking.OneTransportReceived && booking.BookingStatus ==
        // 'Unconfirmed') {            var seconds =
        // moment(booking.OneTransportReceived).add(90, 'seconds').diff(moment(),
        // "seconds");            booking.$countup = seconds + " secs";            if
        // (seconds < 0) {                indexes.unshift(index);            }        }
        // else if (booking.$countup != null) {            delete booking.$countup;   }
        // });    angular.forEach(indexes, function (i) {
        // $scope.dispatchObj.bookings.items.splice(i, 1);
        // $scope.dispatchObj.bookings.formatBookings($scope.dispatchObj.bookings.items)
        // ;    }); }


        $scope.getScoreClass = function (value) {
            if (value >= 75) {
                return 'label-success';
            } else if (value >= 30) {
                return 'label-warning';
            } else {
                return 'label-danger';
            }
        };

        function removeCompleted(b) {
            var index = $scope
                .dispatchObj
                .bookings
                .items
                .indexOf(b);
            $scope
                .dispatchObj
                .bookings
                .items
                .splice(index, 1);
            $scope
                .dispatchObj
                .bookings
                .formatBookings($scope.dispatchObj.bookings.items);
        }

        function removeCancelled(b) {
            var index = $scope
                .dispatchObj
                .bookings
                .items
                .indexOf(b);
            $scope
                .dispatchObj
                .bookings
                .items
                .splice(index, 1);
            $scope
                .dispatchObj
                .bookings
                .formatBookings($scope.dispatchObj.bookings.items);
        }

        function disabledStatus(b, status) {
            // var values = ["OnRoute", "Arrived", "InProgress", "Completed", "Cancelled",
            // "COA"];
            if (status == 'Cancelled' || status == 'COA') {
                return false;
            }
            if (b.BookingStatus == 'Completed') {
                return true;
            }
        }

        function updateBookingStatus(b, status) {
            var booking = new Model.Booking(b);
            b.$updating = true;

            if (status == "Cancelled") {
                swal({
                    title: "Are you sure?",
                    text: "The Booking will be cancelled and not billed to client. Are you sure?",
                    showCancelButton: true,
                    closeOnConfirm: false,
                    animation: "slide-from-top"
                }, function () {
                    booking.BookingStatus = status;
                    booking
                        .$patch(true)
                        .then(function () {
                            b.$updating = false;
                            booking.$commit(true);
                        });
                    swal("Cancelled", "Booking is cancelled.", "success");
                    return true;
                });
                b.$updating = false;
            } else if (status == "COA") {
                swal({
                    title: "Are you sure?",
                    text: "The Booking will be marked COA and client may be billed a minimum amount. Are you sure?",
                    showCancelButton: true,
                    closeOnConfirm: false,
                    animation: "slide-from-top",
                }, function () {
                    booking.BookingStatus = status;
                    booking
                        .$patch(true)
                        .then(function () {
                            b.$updating = false;
                            booking.$commit(true);
                        });
                    swal("Cancelled", "Booking has been Cancelled on Arrival.", "success")
                    return true;
                });
                b.$updating = false;
            } else {
                if (booking.DriverPaymentId || booking.InvoiceId) {
                    swal("Warning", "Booking status cannot be modified as the booking is Invoiced/Driver Paid", "warning");
                    b.$updating = false;
                    return;
                }
                if ((status == "Completed" || status == "Allocated" || status == "OnRoute" || status == "Arrived" || status == "InProgress" || status == "COA") && !booking.DriverId) {
                    swal("Complete Warning", "Booking cannot be completed as there is no driver attached to it.", "warning");
                    b.$updating = false;
                    return;
                }
                if (status == "OpenToBid" && b.PartnerId) {
                    swal("Bid Warning", "Shared booking cannot be sent for bidding", "warning");
                    b.$updating = false;
                    return;
                }
                swal({
                    title: "Are you sure?",
                    text: "Status of the booking will be updated and if applicable a message/phone call wil" +
                        "l be sent to the passenger.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Confirm"
                }, function () {
                    booking.BookingStatus = status;
                    booking
                        .$patch(true)
                        .then(function () {
                            b.$updating = false;
                            booking.$commit(true);
                        });
                });
            }
        }

        $scope
            .$watch('dispatchObj.bookingSearch.$', function () {
                formatBookings($scope.dispatchObj.bookings.items);
            });

        function formatBookings(bookings) {
            $scope.$parent.bookingGroups = [];

            for (var i = 0; i < bookings.length; i++) {
                bookings[i].ImageUrl = 'NA';
            }
            var filteredBookings = $filter('filter')(bookings, $scope.dispatchObj.bookingSearch);
            var orderedBookings = $filter('orderBy')(filteredBookings, [
                function (b) {
                    return new moment(b.BookedDateTime).valueOf();
                },
                'LocalId'
            ]);
            $scope.$parent.orderedBookings = orderedBookings;
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;

            for (var i = 0; i < orderedBookings.length; i++) {
                var booking = orderedBookings[i];

                var minutes = moment(booking.BookedDateTime).diff(moment(), "minutes");
                var hours = moment(booking.BookedDateTime).diff(moment(), "hours");

                if (hours > 24) {
                    booking.$countdown = moment(booking.BookedDateTime).format('dddd');
                } else if (minutes > 120)
                    booking.$countdown = (minutes / 60).toFixed(0) + " hours";
                else if (minutes >= 0) {
                    if (minutes == 1)
                        booking.$countdown = minutes + " min";
                    else
                        booking.$countdown = minutes + " mins";
                } else {
                    if (minutes < -120)
                        booking.$countdown = (Math.abs(minutes) / 60).toFixed(0) + " hours ago";
                    else {
                        if (minutes == -1)
                            booking.$countdown = Math.abs(minutes) + " min ago";
                        else
                            booking.$countdown = Math.abs(minutes) + " mins ago";
                    }
                }

                if (booking.AutoDispatch && booking.DispatchDateTime) {
                    minutes = moment(booking.DispatchDateTime).diff(moment(), "minutes");
                    hours = moment(booking.DispatchDateTime).diff(moment(), "hours");

                    minutes = minutes - 5;

                    if (hours > 24) {
                        booking.$ad = 'AutoDispatch Eligable';
                    } else if (minutes > 120)
                        booking.$ad = 'AutoDispatch Eligable in ' + (minutes / 60).toFixed(0) + ' hours';
                    else if (minutes >= 0) {
                        if (minutes == 1)
                            booking.$ad = 'AutoDispatch Eligable in <1 min';
                        else
                            booking.$ad = 'AutoDispatch Eligable in ' + minutes + ' mins';
                    } else {
                        booking.$ad = 'AutoDispatch Eligable';
                    }
                }


                booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                booking.Summary = booking._JourneySummary;
                for (var j = 0; j < booking.BookingStops.length; j++) {
                    booking.BookingStops[j] = new Model.BookingStop(booking.BookingStops[j]);
                }
            }
            // $scope.$parent.workshareBookings= orderedBookings.filter(function(item){return item.BookingSource=='WORKSHARE'})
        }

        function driverETAReceived(event, args) {
            var _updates = args[0];
            for (i = 0; i < _updates.length; i++) {
                var _found = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .filter(function (d) {
                        return d.Id == _updates[i].BookingId;
                    })[0];
                if (_found) {
                    _found.$eta = _updates[i].Time + " mins";
                    _found.$etaDesc = _updates[i].Description + " mins";
                }
            }
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
        }

        function approveChanges(booking) {
            $http.get($config.API_ENDPOINT + 'api/bookings/ClearEdits', {
                params: {
                    bookingId: booking.Id
                }
            });
        }

        function openEditModal(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=850,width=1000,left=0,top=0');
        }

        function unallocateBooking(b) {
            var booking = new Model.Booking(b);
            swal({
                title: "Are you sure?",
                text: "Driver will be unallocated and will be taken off this booking.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function () {
                if (booking.DriverId) {
                    $http.post($config.API_ENDPOINT + 'api/bookings/UnallocateDriver', null, {
                        params: {
                            bookingId: booking.Id
                        }
                    }).then(function () {
                        booking.BookingStatus = "Incoming";
                        booking.DriverId = null;
                        booking.Driver = null;
                        booking.Partner = null;
                        booking.$commit(true);
                    });
                } else if (booking.PartnerId) {
                    booking.PartnerId = null;
                    booking.BookingStatus = "Incoming";
                    booking
                        .$patch(true)
                        .then(function () {
                            booking.Driver = null;
                            booking.Partner = null;
                            booking.$commit(true);
                        });
                }
            });
        }

        function completeBooking(b) {
            var booking = new Model.Booking(b);
            swal({
                title: "Are you sure?",
                text: "Booking will be marked completed.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function () {
                booking.BookingStatus = "Completed";
                booking
                    .$patch(true)
                    .then(function () {
                        booking.$commit(true);
                    });
            });
        }

        function cancelBooking(b) {
            var booking = new Model.Booking(b);
            swal({
                title: "Are you sure?",
                text: "Booking will be cancelled and handed back.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm"
            }, function () {
                booking.BookingStatus = "Cancelled";
                booking
                    .$patch(true)
                    .then(function () {
                        booking.$commit(true);
                    });
            });
        }

        function allocateDriver(booking, driverId, misc) {
            if (angular.isDefined(misc)) {
                $http.get($config.API_ENDPOINT + 'api/dispatch/tracking', {
                    params: {
                        bookingId: booking.Id,
                        driverId: driverId,
                        accepted: (misc == 1) ? 'true' : 'false'
                    }
                });
            }
            $modal.open({
                templateUrl: '/webapp/management/dispatch/modals/allocation/modal.html',
                controller: 'DispatchBookingAllocateModalController',
                size: 'md',
                windowClass: 'allocation-modal',
                backdrop: 'static',
                keyboard: false,
                resolve: {
                    rBooking: function () {
                        return booking;
                    },
                    rChoosen: function () {
                        return driverId;
                    }
                }
            });
        }

        $scope.confirm = confirm;

        function confirm(type, notify, booking, driverId) {
            $http.post($config.API_ENDPOINT + 'api/bookings/ChooseDriver', null, {
                params: {
                    driverId: driverId,
                    bookingId: booking.Id,
                    hard: (type == 'HARD'),
                    notify: notify
                }
            }).success(function () {
                swal('Assigned', 'Booking has been assigned.', 'success');
            });
        }

        function addExpense(booking) {
            $modal.open({
                templateUrl: '/webapp/management/dispatch/modals/expenses/modal.html',
                controller: 'DispatchBookingExpensesModalController',
                resolve: {
                    rBooking: function () {
                        return booking;
                    },
                    rExpenseTypes: [
                        'Model',
                        function (Model) {
                            return Model
                                .BookingExpenseType
                                .query()
                                .execute();
                        }
                    ],
                    rTaxes: [
                        'Model',
                        function (Model) {
                            return Model
                                .Tax
                                .query()
                                .execute();
                        }
                    ]
                }
            });
        }

        $scope
            .$watch('SIGNALR.status', function (newvalue, oldvalue) {
                if (newvalue == 4 && newvalue != oldvalue) {
                    //refetchBookings();
                }
            });

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

        function fetchDriverRecommendations() {
            $http.get($config.API_ENDPOINT + 'api/dispatch', function () {})
        }

        function refetchBookings() {
            $scope.fetching = true;
            //addHistory("Fetching Bookings", "FETCH");
            var from = new moment()
                .add($scope.dispatchObj.filters.fromSpan, 'seconds')
                .format();
            var to = new moment()
                .add($scope.dispatchObj.filters.toSpan, 'seconds')
                .format();

            var params = {
                from: from,
                to: to
            }

            var keys = Object.keys($scope.dispatchObj.filters.bookingStatuses)
            for (var i = 0; i < keys.length; i++) {
                if ($scope.dispatchObj.filters.bookingStatuses[keys[i]]) {
                    params[keys[i]] = true;
                    if (keys[i] == "Cancelled") {
                        params['COA'] = true;
                    }
                } else {
                    params[keys[i]] = false;
                }
            }

            $http.get($config.API_ENDPOINT + 'api/bookings/fordispatch', {
                params: params
            }).then(function (response) {
                var data = response.data.map(function (x) {
                    return new Model.Booking(x);
                });
                data
                    .map(function (b) {
                        b.$pre = isPreBooking(b);
                        if (b.FlightInfo) {
                            if (moment().diff(moment(b.FlightInfo.LastUpdate), 'hours') > 10) {
                                b.FlightInfo.$Status = "No updates yet."
                            } else {
                                b.FlightInfo.$Status = "Last Updated " + moment(b.FlightInfo.LastUpdate).fromNow();
                            }
                        }
                    })
                var offers = {};
                var selected = {};
                var recommendations = {};
                var warnings = {};
                var etas = {};
                angular.forEach($scope.dispatchObj.bookings.items, function (b) {
                    if (!!b.$offer) {
                        offers[b.$offer.BookingId] = b.$offer;
                    }
                    if (b.$selected) {
                        selected[b.Id] = true;
                    }

                    if (!!b.$recommendation) {
                        recommendations[b.Id] = b.$recommendation;
                    }

                    if (!!b.$warning) {
                        warnings[b.Id] = b.$warning;
                    }

                    if (!!b.$eta) {
                        etas[b.Id] = b.$eta;
                    }
                });
                $scope.dispatchObj.bookings.items.length = 0; //needed to clear one time bindings

                $timeout(function () {
                    angular
                        .forEach(data, function (booking) {
                            if (booking.OneTransportReceived && booking.BookingStatus == 'Unconfirmed' && booking.OneTransportStatus != 'Accepted' && booking.OneTransportStatus != 'AutoAccepted') {
                                var seconds = moment(booking.OneTransportReceived)
                                    .add(90, 'seconds')
                                    .diff(moment(), "seconds");
                                booking.$countup = seconds + " secs";
                                if (seconds < 0) {
                                    return;
                                }
                            }

                            booking.$offer = offers[booking.Id];
                            booking.$selected = selected[booking.Id];
                            booking.$recommendation = recommendations[booking.Id];
                            booking.$warning = warnings[booking.Id];
                            booking.$eta = etas[booking.Id];

                            if (booking.DriverBids && booking.DriverBids.length > 0) {
                                booking.Bids = "active bids";
                            }

                            $scope
                                .dispatchObj
                                .bookings
                                .items
                                .push(booking);
                        });
                    $scope
                        .dispatchObj
                        .map
                        .updateBookingMarkers();
                    $scope
                        .dispatchObj
                        .bookings
                        .formatBookings($scope.dispatchObj.bookings.items);
                    $scope.fetching = false;
                    $timeout(function () {
                        _setupKeyPressOnBookings();
                    }, 0);
                }, 0);

                addHistory("Bookings Fetched", "SUCCESS");
            }, function () {
                addHistory("Bookings Failed", "FAIL");
            });
        }

        function editBooking(booking) {
            window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + booking.Id + '&editnow=true&clientId=' + booking.ClientId, 'EDIT:' + booking.Id, 'height=850,width=1200,left=0,top=0');
        }

        function openBooking(booking) {
            if (booking) {
                $modal.open({
                    templateUrl: '/webapp/management/dispatch/modals/booking-info.modal.html',
                    size: 'lg',
                    scope: $scope,
                    controller: 'DispatchBookingModalController',
                    resolve: {
                        rBooking: function () {
                            return $http({
                                method: 'GET',
                                url: $config.API_ENDPOINT + '/api/bookings/GetDetailsForBooking?bookingId=' + booking.Id,
                            }).then(function success(response) {
                                return new Model.Booking(response.data);
                            }, function error(response) {
                                swal("Error Occured", "Some issue while pulling the details for the booking", "error");
                            });
                            //return booking;
                        },
                        rDispatchObj: function () {
                            return $scope.dispatchObj;
                        },
                        rWarning: function () {
                            return booking.$warning;
                        }
                    }
                })

            }
        }

        function addToBidQueue(booking) {
            booking.$selected = !booking.$selected;
            $scope.dispatchObj.bookings.reload++;
        }

        function startBid() {
            if ($scope.COMPANY.EnableBidding == true) {
                $modal.open({
                    templateUrl: '/webapp/management/dispatch/modals/driver-bid/modal.html',
                    size: 'lg',
                    controller: 'DispatchBookingsBidController',
                    resolve: {
                        rBookings: function () {
                            return $scope.orderedBookings.filter(function (b) {
                                return b.$selected;
                            });
                        }
                    }
                }).result.then(function (clear) {
                    if (clear) {
                        $scope.orderedBookings.map(function (b) {
                            b.$selected = false;
                        });
                        $scope.dispatchObj.bookings.reload++;
                    }
                });
            } else {
                swal("Setting Disabled", "Please enable auction settings for bidding facility or feel free to contact admin.", "warning");
            }
        }

        function selectBooking(booking) {
            if (!$scope.dispatchObj.map.selected.bookingId || $scope.dispatchObj.map.selected.bookingId != booking.Id) {
                var driver = null;
                var partnerDriver = null;
                if (booking && booking.DriverId) {
                    driver = $scope
                        .dispatchObj
                        .drivers
                        .items
                        .filter(function (ds) {
                            return ds.DriverId == booking.DriverId
                        })[0];
                }
                if (booking && booking.PartnerId && booking.PartnerDriverId) {
                    partnerDriver = booking.PartnerDriver
                }
                $scope
                    .dispatchObj
                    .map
                    .select(booking, driver, partnerDriver);
                $scope.dispatchObj.selectedRow = $scope
                    .orderedBookings
                    .indexOf(booking);
            } else {
                $scope.dispatchObj.selectedBooking = null;
                $scope
                    .dispatchObj
                    .map
                    .select(null, null);
                $scope.dispatchObj.selectedRow = null;
            }
        }

        function isPreBooking(b) {
            var _bookedTime = new moment(b.BookedDateTime);
            var _creationTime = new moment(b.CreationTime);

            var _duration = moment
                .duration(_bookedTime.diff(_creationTime))
                .asMinutes();
            if (_duration > 30) {
                return true;
            } else {
                return false;
            }
        }

        function manageKeyPress($event, booking) {
            if ($event.keyCode == '13') {
                $scope.dispatchObj.selectedBooking = booking;
                $scope
                    .dispatchObj
                    .map
                    .drawRoute(booking);
            } else if ($event.keyCode == '27') {
                selectBooking(null);
            }
        }

        function _setupKeyPressOnBookings() {
            $('#dispatch .booking')
                .bind('keydown', function (eInner) {
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