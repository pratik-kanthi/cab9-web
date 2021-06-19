(function (angular) {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchController', DispatchController);
    DispatchController.$inject = [
        '$scope',
        'Model',
        '$filter',
        'SignalR',
        '$timeout',
        '$modal',
        '$state',
        '$interval',
        '$http',
        '$config',
        '$window',
        'Notification',
        '$rootScope'
    ];

    function DispatchController($scope, Model, $filter, SignalR, $timeout, $modal, $state, $interval, $http, $config, $window, Notification, $rootScope) {
        $scope.exit = exit;
        $scope.dispatchObj = {
            live: {
                status: false,
                toggleLive: toggleLive
            },
            workshare: {
                driverStatus: false,
                items: [],
                badgeCount: 0,
                bookings: [],
                toggleDrivers: toggleWorkshareDrivers
            },
            dispatch: {
                status: false,
                toggleDispatch: toggleDispatch,
                settings: {}
            },
            sound: {
                status: false,
                toggleSound: toggleSound
            },
            history: [],
            map: {
                // google maps object
                mapObject: null,

                //display options for map
                displayOptions: {
                    bookings: 1, //0 - Off, 1 - Scattered, 2 - Clustered
                    drivers: 1, //0 - Off, 1 - Scattered, 2 - Clustered
                    traffic: true,
                    heatmap: false
                },

                // function that taken in bookings and add a $marker object to each booking
                // whilst plotting them on the map. pass plotMarkers(null) to clear all bookings.
                plotMarkers: angular.noop,

                // function that taken in drivers and add a $marker object to each driver whilst
                // plotting them on the map. pass plotDriverMarkers(null) to clear all drivers.
                plotDriverMarkers: angular.noop,

                // function that draws route for a booking. pass cleaarRoute(null) to clear the
                // selected route.
                drawRoute: angular.noop,

                //function to toggle traffic
                toggleTraffic: angular.noop
            },
            newBooking: {},
            phoneCall: null,
            listOfCallers: null,
            bookings: {
                // all the booking for the selected filters
                items: [],

                // function to select a booking. pass selectBooking(null) to clear the selected
                // booking
                selectBooking: angular.noop,

                // function to refetch bookings.
                refetchBookings: angular.noop

            },
            partnerDrivers: {
                items: []
            },
            drivers: {
                // all the drivers for the selected filters
                items: [],

                // function to select an individual driver
                selectDriver: angular.noop,

                //variable being watched for re-rendering React Driver Component
                reload: 0
            },
            bookingSearch: {},
            driverSearch: {},
            selectedBooking: null,
            selectedDriver: null,
            filters: _getStoredOrDefaultFilters()
        };
        $scope.bookingGroups = [];
        $scope.showFilterModal = showFilterModal;
        var interval = $interval(updateCountup, 1000);
        $scope.openWorkshareTab = openWorkshareTab;

        $http.get($config.API_ENDPOINT + 'api/DispatchSettings').then(function (s) {
            if (s.data[0]) {
                $scope.dispatchObj.dispatch.settings = s.data[0];
                $scope.dispatchObj.dispatch.status = $scope.dispatchObj.dispatch.settings.Active;
                $scope.dispatchObj.dispatch.mode = $scope.dispatchObj.dispatch.settings.Mode;
            }
        });
        var listeners = {
            partnerDrivers: null
        };
        fetchWorkshareBookings();
        toggleWorkshareDrivers();

        function fetchWorkshareBookings() {
            $http.get($config.API_ENDPOINT + 'api/bookings/workshare-bookings').then(function (response) {
                var data = response.data.map(function (x) {
                    return new Model.Booking(x);
                });
                $scope.dispatchObj.workshare.bookings = data;
            }, function () {});
        }
        $('.options-mobile-toggle').on('click', function () {
            $('.options.right').toggleClass('show-options');
        });

        function exit() {
            for (i = 0; i < _expenseNotifications.length; i++) {
                _expenseNotifications[i].$notification.then(function (notification) {
                    notification.kill(true);
                });
            }
            $window.location.href = '/webapp/management/index.html';
        }

        var _expenseNotifications = [];
        $scope.$on('SIGNALR_bookingDriverAck', function (event, data) {
            var found = $scope.dispatchObj.bookings.items.find(function (b) {
                return b.Id == data[0];
            });
            if (found) {
                found.DriverAck = true;
                $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
            }
        });

        function setupCallScope(number, identifier) {
            var _scope = $scope.$new();

            _scope.callData = {
                label: "Calling...",
                value: number,
                status: 'RINGING'
            }

            _scope.chooseBookingFromCall = function (localId) {
                $scope.dispatchObj.bookingSearch.$ = localId;
            }

            _scope.removeNotification = function () {
                this.kill(true);
            }
            _scope.handleNewBooking = function (callData) {
                $scope.dispatchObj.phoneCall = new Model.TelephonyCall();
                $scope.dispatchObj.phoneCall.Caller = number;
                $scope.dispatchObj.phoneCall.CallIdentifier = identifier;
                $http({
                    method: 'GET',
                    url: $config.API_ENDPOINT + '/api/telephony/callers-for-number',
                    params: {
                        "number": $scope.dispatchObj.phoneCall.Caller.replaceAll(" ", "")
                    },
                    paramSerializer: '$httpParamSerializerJQLike'
                }).then(function successCallback(response) {
                    if (response.data) {
                        response.data.Passengers.map(function (p) {
                            p.$Description = p.Name;
                            if (p.Client && p.Client.Name) {
                                p.$Description += ' - ' + p.Client.Name;
                            }
                        });
                        $scope.dispatchObj.listOfCallers = response.data;
                    }
                }, function errorCallback(response) {});

                $state.go("dispatch.newbooking", {}, {
                    reload: false
                });
                $scope.$broadcast("CALLNEWBOOKINGREQUESTED", null);
            }

            //Get Caller Name

            $http({
                method: 'GET',
                url: $config.API_ENDPOINT + '/api/telephony/caller-name',
                params: {
                    "number": number
                },
                paramSerializer: '$httpParamSerializerJQLike'
            }).then(function successCallback(response) {
                if (response.data.length > 0) {
                    console.log(response.data);
                    _scope.callData.value = response.data;

                }
            }, function errorCallback(response) {});

            //Check if caller has an existing booking and pull basic booking details
            $http({
                method: 'GET',
                url: $config.API_ENDPOINT + '/api/telephony/existing-booking',
                params: {
                    "number": number
                },
                paramSerializer: '$httpParamSerializerJQLike'
            }).then(function successCallback(response) {
                if (response.data) {
                    _scope.callData.existingBooking = response.data;
                }
            }, function errorCallback(response) {});



            return _scope;
        }

        var _pNotifications = [];
        $scope.$on('SIGNALR_ringing', function (event, data) {

            var found = _pNotifications.filter(function (dr) {
                return dr.$id == data[0].CallIdentifier;
            });
            if (!found || found.length == 0) {
                var _scope = setupCallScope(data[0].Caller.replaceAll(" ", ""), data[0].CallIdentifier);
                var _not = Notification.success({
                    message: "Incoming Call",
                    closeOnClick: false,
                    templateUrl: "phone_notification_template.html",
                    scope: _scope
                });
                _pNotifications.push({
                    $id: data[0].CallIdentifier,
                    $caller: data[0].Caller,
                    $notification: _not,
                    $scope: _scope
                });
            } else {

            }


        });

        $scope.$on('SIGNALR_answered', function (event, data) {
            var found = _pNotifications.filter(function (dr) {
                return dr.$id == data[0].CallIdentifier;
            });

            if (!found || found.length == 0) {
                var _scope = setupCallScope(data[0].Caller.replaceAll(" ", ""), data[0].CallIdentifier);

                var _not = Notification.success({
                    message: "Answered Call",
                    closeOnClick: false,
                    templateUrl: "phone_notification_template.html",
                    scope: _scope
                });

                _pNotifications.push({
                    $id: data[0].CallIdentifier,
                    $caller: data[0].Caller,
                    $notification: _not,
                    $scope: _scope
                });

                found = _pNotifications;

            }

            if (data[0].StaffId == $rootScope.STAFF_ID) {
                console.log(found[0].$scope.callData.value);
                var callerName = found[0].$scope.callData.value;
                var existingBooking = found[0].$scope.callData.existingBooking;
                found[0].$scope.callData = {
                    label: "Talking to " + callerName,
                    value: "00:00",
                    seconds: 0,
                    status: 'ANSWERED',
                    existingBooking: existingBooking
                }
                found[0].$scope.timer = $interval(function () {
                    found[0].$scope.callData.seconds += 1;
                    found[0].$scope.callData.value = window.$utilities.secondsToHms(found[0].$scope.callData.seconds);
                }, 1000);

            } else {
                found[0].$notification.then(function (notification) {
                    notification.kill(true);
                });
            }
        });

        $scope.$on('SIGNALR_hungUp', function (event, data) {
            var found = _pNotifications.filter(function (dr) {
                return dr.$id == data[0].CallIdentifier;
            });

            if (found.length > 0) {
                found[0].$notification.then(function (notification) {
                    notification.kill(true);
                });
                _pNotifications.splice(_pNotifications.indexOf(found[0]), 1);
                $interval.cancel(found[0].$scope.timer);
            }
        });

        $scope.$on('SIGNALR_newExpenseNotification', function (event, data) {
            var _scope = $scope.$new();
            _scope.expense = data[0];
            _scope.acceptExpense = acceptExpense;
            _scope.declineExpense = declineExpense;
            _scope.openEditModal = openEditModal;
            _scope.formatUrl = window.$utilities.formatUrl;

            function openEditModal($event, expense) {
                window.open('/webapp/common/modals/bookings/edit-booking/window.html#?id=' + expense.BookingId + '&clientId=' + expense.ClientId, 'EDIT:' + expense.BookingId, 'height=850,width=1000,left=0,top=0');
                $event.stopPropagation();
            }

            function declineExpense(expense) {
                swal({
                    title: "Confirm Decline",
                    text: "Are you sure you want to decline this expense?",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Confirm Decline"
                }, function () {
                    $http.patch($config.API_ENDPOINT + 'api/Expense/bookingexpense?BookingExpenseId=' + expense.ExpenseId + '&Status=false').then(function (response) {
                        _not.then(function (notification) {
                            notification.kill(true);
                        });
                    }, function (err) {
                        swal("Error", "Something didn't work, please try again", "error");
                    })
                });
            }

            function acceptExpense(expense) {
                $http.patch($config.API_ENDPOINT + 'api/Expense/bookingexpense?BookingExpenseId=' + expense.ExpenseId + '&Status=true').then(function (response) {
                    _not.then(function (notification) {
                        notification.kill(true);
                    });
                }, function (err) {
                    swal("Error", "Something didn't work, please try again", "error");
                })
            }

            var _not = Notification.success({
                message: "Just message",
                closeOnClick: false,
                templateUrl: "expense_notification_template.html",
                scope: _scope
            });
            _expenseNotifications.push({
                $expenseId: data[0].ExpenseId,
                $notification: _not
            })
        })

        $scope.$on('SIGNALR_declinedExpenseNotification', function (event, data) {
            var found = _expenseNotifications.filter(function (dr) {
                return dr.$expenseId == data[0].ExpenseId;
            });

            if (found.length > 0) {
                found[0].$notification.then(function (notification) {
                    notification.kill(true);
                });
            }
        });

        $scope.$on('SIGNALR_approvedExpenseNotification', function (event, data) {
            var found = _expenseNotifications.filter(function (dr) {
                return dr.$expenseId == data[0].ExpenseId;
            });

            if (found.length > 0) {
                found[0].$notification.then(function (notification) {
                    notification.kill(true);
                });
            }
        });

        function showFilterModal() {
            if ($state.is('dispatch.bookings')) {
                $modal.open({
                        templateUrl: '/webapp/management/dispatch/modals/filter/booking-modal.html',
                        controller: 'DispatchBookingFilterModalController',
                        backdrop: 'static',
                        resolve: {
                            rFilters: function () {
                                return $scope.dispatchObj.filters;
                            }
                        }
                    })
                    .result
                    .then(function (result) {
                        $scope
                            .dispatchObj
                            .bookings
                            .refetchBookings();
                        sessionStorage.setItem('CAB9_DISPATCH_FILTERS', JSON.stringify($scope.dispatchObj.filters));
                    });
            } else if ($state.is('dispatch.workshare')) {
                $modal.open({
                        templateUrl: '/webapp/management/dispatch/modals/filter/booking-modal.html',
                        controller: 'DispatchBookingFilterModalController',
                        backdrop: 'static',
                        resolve: {
                            rFilters: function () {
                                return $scope.dispatchObj.filters;
                            }
                        }
                    })
                    .result
                    .then(function (result) {
                        $scope
                            .dispatchObj
                            .bookings
                            .refetchBookings();
                        sessionStorage.setItem('CAB9_DISPATCH_FILTERS', JSON.stringify($scope.dispatchObj.filters));
                    });
            } else if ($state.is('dispatch.drivers')) {
                $modal.open({
                        templateUrl: '/webapp/management/dispatch/modals/filter/driver-modal.html',
                        controller: 'DispatchDriverFilterModalController',
                        backdrop: 'static',
                        resolve: {
                            rFilters: function () {
                                return $scope.dispatchObj.filters;
                            }
                        }
                    })
                    .result
                    .then(function (result) {

                        $scope
                            .dispatchObj
                            .bookings
                            .refetchBookings();
                        sessionStorage.setItem('CAB9_DISPATCH_FILTERS', JSON.stringify($scope.dispatchObj.filters));
                        $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                    });
            }
        }

        $scope.$on('SIGNALR_updateDriverStatus', onUpdateDriverStatus);
        $scope.$on('SIGNALR_updateBooking', onUpdateBooking);
        $scope.$on('SIGNALR_updateBookingStatus', onUpdateBookingStatus);
        $scope.$on('SIGNALR_updateBookingOffer', onUpdateBookingOffer);
        $scope.$on('SIGNALR_updateDriverLocation', onUpdateDriverLocation);
        $scope.$on('SIGNALR_dispatchRecommendations', onDispatchRecommendations);
        $scope.$on('SIGNALR_dispatchWarnings', onDispatchWarnings);

        window.dispatchCleanup.push(function () {
            $scope.$destroy();
            if (interval) {
                $interval.cancel(interval);
            }
        });

        $timeout(function () {

            if (sessionStorage.getItem('CAB9:DISPATCH:UPDATES')) {
                sessionStorage.removeItem('CAB9:DISPATCH:UPDATES')
                //toggleLive(true);
            }
            if (sessionStorage.getItem('CAB9:DISPATCH:SOUND')) {
                toggleSound(true);
            }
            SignalR
                .server
                .startShifts();
            SignalR
                .server
                .startTelephonyEvents();
        }, 1000);

        function updateCountup() {
            if ($scope.dispatchObj.unconfirmed && $scope.dispatchObj.unconfirmed.items) {
                var indexes = [];
                angular.forEach($scope.dispatchObj.unconfirmed.items, function (booking, index) {
                    if (booking.OneTransportStatus != 'Accepted' && booking.OneTransportStatus != 'AutoAccepted') {
                        var seconds = moment(booking.OneTransportReceived)
                            .add(75, 'seconds')
                            .diff(moment(), "seconds");
                        booking.$countup = seconds + " secs";
                        if (seconds < 0) {
                            indexes.unshift(index);
                        }
                    }
                });


                angular.forEach(indexes, function (i) {
                    $scope
                        .dispatchObj
                        .unconfirmed
                        .items
                        .splice(i, 1);
                });

                if ($scope.dispatchObj.unconfirmed.items.length > 0) {
                    $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
                }
            }

            if ($scope.dispatchObj.bookings.items) {
                var indexes = [];
                angular.forEach($scope.dispatchObj.bookings.items, function (booking, index) {
                    if (booking.OneTransportReceived && booking.BookingStatus == 'Unconfirmed' && booking.OneTransportStatus != 'Accepted' && booking.OneTransportStatus != 'AutoAccepted') {
                        var seconds = moment(booking.OneTransportReceived)
                            .add(90, 'seconds')
                            .diff(moment(), "seconds");
                        booking.$countup = seconds + " secs";
                        if (seconds < 0) {
                            indexes.unshift(index);
                        }
                    } else if (booking.$countup != null) {
                        delete booking.$countup;
                    }
                });

                angular.forEach(indexes, function (i) {
                    $scope
                        .dispatchObj
                        .bookings
                        .items
                        .splice(i, 1);
                    //$scope.dispatchObj.bookings.formatBookings($scope.dispatchObj.bookings.items);
                });
            }
        }

        $scope
            .$on('$destroy', function () {
                SignalR
                    .server
                    .stopShifts();

                SignalR
                    .server
                    .stopTelephonyEvents();

                toggleLive(false);
            });

        function toggleLive(fix) {
            var newState = null;
            var oldState = $scope.dispatchObj.live.status;
            if (fix === null || fix === undefined) {
                newState = !oldState;
            } else {
                newState = fix;
            }

            if (oldState && !newState) {
                SignalR
                    .server
                    .stopLocations();
            } else if (newState && !oldState) {
                SignalR
                    .server
                    .startLocations();
            }

            $scope.dispatchObj.live.status = newState;
            if (newState) {
                sessionStorage.setItem('CAB9:DISPATCH:UPDATES', 'live');
            } else {
                sessionStorage.removeItem('CAB9:DISPATCH:UPDATES');
            }
        }

        function toggleSound(fix) {
            var newState = null;
            var oldState = $scope.dispatchObj.sound.status;
            if (fix === null || fix === undefined) {
                newState = !oldState;
            } else {
                newState = fix;
            }

            $scope.dispatchObj.sound.status = newState;
            if (newState) {
                sessionStorage.setItem('CAB9:DISPATCH:SOUND', 'ON');
            } else {
                sessionStorage.removeItem('CAB9:DISPATCH:SOUND');
            }
        }

        function toggleDispatch(fix) {
            var newState = null;
            var oldState = $scope.dispatchObj.dispatch.status;
            if (fix === null || fix === undefined) {
                newState = !oldState;
            } else {
                newState = fix;
            }

            $scope.dispatchObj.dispatch.status = newState;
            $http.patch($config.API_ENDPOINT + 'api/DispatchSettings', {
                Id: $scope.dispatchObj.dispatch.settings.Id,
                Active: newState
            }, {
                params: {
                    Id: $scope.dispatchObj.dispatch.settings.Id
                }
            });
        }

        function toggleWorkshareDrivers() {
            $scope.dispatchObj.workshare.driverStatus = !$scope.dispatchObj.workshare.driverStatus;
            if ($scope.dispatchObj.workshare.driverStatus) {
                fetchPartnerDrivers();
                listeners.partnerDrivers = $scope.$on('SIGNALR_updatePartnerDriverLocations', onUpdatePartnerDriverLocations);
            } else {
                if (listeners.partnerDrivers)
                    listeners.partnerDrivers();
                $scope.dispatchObj.partnerDrivers.items.length = 0;
                $scope
                    .dispatchObj
                    .map
                    .updatePartnerDriverMarkers();

            }
        }

        function onUpdateDriverStatus(event, args) {
            var update = args[0];


            var found = $scope
                .dispatchObj
                .drivers
                .items
                .filter(function (x) {
                    return x.DriverId == update.Id
                })[0];

            if (found) {
                found.DriverStatus = update.DriverStatus;
                found.WeeksEarnings = update.Earnings;
            } else if (update.Shift) {
                $scope
                    .dispatchObj
                    .drivers
                    .items
                    .push(update.Shift);
            }

            var byStatus = {
                Available: [],
                Clearing: [],
                OnJob: [],
                OnBreak: []
            };

            angular.forEach($scope.dispatchObj.drivers.items, function (d) {
                if (d.DriverStatus != 'Offline')
                    byStatus[d.DriverStatus].push(d);
            });

            $scope.dispatchObj.drivers.byStatus.length = 0;

            if (byStatus.Available.length > 0) {
                $scope
                    .dispatchObj
                    .drivers
                    .byStatus
                    .push({
                        status: 'Available',
                        display: 'Available',
                        drivers: byStatus.Available
                    })
            }
            if (byStatus.Clearing.length > 0) {
                $scope
                    .dispatchObj
                    .drivers
                    .byStatus
                    .push({
                        status: 'Clearing',
                        display: 'Clearing',
                        drivers: byStatus.Clearing
                    })
            }
            if (byStatus.OnJob.length > 0) {
                $scope
                    .dispatchObj
                    .drivers
                    .byStatus
                    .push({
                        status: 'OnJob',
                        display: 'On Job',
                        drivers: byStatus.OnJob
                    })
            }
            if (byStatus.OnBreak.length > 0) {
                $scope
                    .dispatchObj
                    .drivers
                    .byStatus
                    .push({
                        status: 'OnBreak',
                        display: 'On Break',
                        drivers: byStatus.OnBreak
                    })
            }

            $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
            $scope.$apply();
        }

        function onDispatchRecommendations(event, args) {
            var results = args[0];
            angular.forEach($scope.dispatchObj.bookings.items, function (booking) {
                var recommendation = results.filter(function (r) {
                    return r.BookingId == booking.Id;
                })[0];
                if (recommendation) {
                    booking.$recommendation = recommendation;
                } else {
                    booking.$recommendation = null;
                }
            });
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
        }

        function onDispatchWarnings(event, args) {
            var results = args[0];
            angular.forEach($scope.dispatchObj.bookings.items, function (booking) {
                var warning = results.filter(function (r) {
                    return r.BookingId == booking.Id;
                })[0];
                if (warning) {
                    booking.$warning = warning;
                } else {
                    booking.$warning = null;
                }
            });
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
        }


        function openWorkshareTab(booking) {
            $state.go('dispatch.workshare');
            $scope.dispatchObj.workshare.badgeCount = 0;
            $timeout(function () {
                $scope.dispatchObj.bookings.reload++;
            }, 1000)
        }

        function onUpdateBooking(event, args) {
            var update = args[0];
            if (update.BookingSource == 'WORKSHARE') {
                fetchWorkshareBookings();
            } else if (update.BookingStatus == 'Unconfirmed') {
                if ($scope.dispatchObj.sound.status) {
                    try {
                        var msg = new SpeechSynthesisUtterance('New One Transport booking requires attention!');
                        msg.voice = speechSynthesis
                            .getVoices()
                            .filter(function (voice) {
                                return voice.name == "Google UK English Female";
                            })[0];
                        speechSynthesis.speak(msg);
                    } catch (e) {}
                }

                var found = $scope
                    .dispatchObj
                    .unconfirmed
                    .items
                    .find(function (d) {
                        return d.Id == update.Id;
                    });
                if (found) {
                    var index = $scope.dispatchObj.unconfirmed.items.indexOf(found);
                    var newArray = $scope.dispatchObj.unconfirmed.items.slice();
                    newArray.splice(index, 1, update);
                    $scope.dispatchObj.unconfirmed.items.length = 0;
                    $scope.dispatchObj.unconfirmed.formatBookings(newArray);
                } else {
                    var newArray = $scope.dispatchObj.unconfirmed.items.slice();
                    newArray.push(update);
                    $scope.dispatchObj.unconfirmed.items.length = 0;
                    $scope.dispatchObj.unconfirmed.formatBookings(newArray);
                }
            }

            if (update.DriverBids && update.DriverBids.length > 0) {
                update.Bids = "active bids";
            }

            var found = $scope.dispatchObj.bookings.items.filter(function (d) {
                return d.Id == update.Id;
            })[0];
            var selected = (found && found.$selected);
            var satisfiesFilters = true;
            var testStatus = update.BookingStatus;
            if (testStatus == 'Arrived') {
                testStatus = 'InProgress';
            }
            var min = new moment().add($scope.dispatchObj.filters.fromSpan, 'seconds');
            var max = new moment().add($scope.dispatchObj.filters.toSpan, 'seconds');
            var test = new moment(update.BookedDateTime);
            var statuses = $scope.dispatchObj.filters.bookingStatuses;
            if (test.isBefore(min) || test.isAfter(max)) {
                satisfiesFilters = false;
            }

            // console.log(test.format() + ': ' + update.BookingStatus + ' - ' + (found &&
            // found.BookingStatus));
            if (found && satisfiesFilters && statuses[testStatus]) {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);
                if (merged.BookingStatus == "OnRoute") {
                    merged.$eta = "ETA: Calculating...";
                    merged.$etaDesc = "Calculating ETA to Pickup";
                }
                if (merged.BookingStatus == "InProgress") {
                    merged.$eta = "ETA: Calculating...";
                    merged.$etaDesc = "Calculating ETA to DropOff"
                }
                //console.log('replaced')
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'Completed' && found.BookingStatus != 'Completed') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCompleted = true;
                //console.log('recently completed - replaced');

                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'COA' && found.BookingStatus != 'COA') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCancelled = true;
                //console.log('recently completed - replaced');
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'Cancelled' && found.BookingStatus != 'Cancelled') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCancelled = true;
                //console.log('recently completed - replaced');

                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && (!satisfiesFilters || !statuses[testStatus])) {
                //console.log('removed')
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (satisfiesFilters && statuses[testStatus] && testStatus == 'Incoming' && moment(update.CreationTime).isAfter(new moment().subtract(2, 'minute'))) {
                //console.log('added')
                var entity = new Model.Booking(update);
                entity.$new = true;
                entity.$pre = isPreBooking(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .push(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (satisfiesFilters && statuses[testStatus]) {
                //console.log('added')
                var entity = new Model.Booking(update);
                entity.$pre = isPreBooking(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .push(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            }

            $scope
                .dispatchObj
                .bookings
                .formatBookings($scope.dispatchObj.bookings.items);
            $scope
                .dispatchObj
                .map
                .updateBookingMarkers();
            $scope
                .dispatchObj
                .map
                .updateFocus();

            console.log('onUpdateBooking - $scope.$apply');
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
            $scope.$apply();

        }

        function onUpdateBookingStatus(event, args) {
            var update = args[0];

            var found = $scope.dispatchObj.bookings.items.find(function (d) {
                return d.Id == update.Id;
            });
            var selected = (found && found.$selected);
            var satisfiesFilters = true;
            var testStatus = update.BookingStatus;
            var min = new moment().add($scope.dispatchObj.filters.fromSpan, 'seconds');
            var max = new moment().add($scope.dispatchObj.filters.toSpan, 'seconds');
            var test = new moment(found.BookedDateTime);
            var statuses = $scope.dispatchObj.filters.bookingStatuses;
            if (test.isBefore(min) || test.isAfter(max)) {
                satisfiesFilters = false;
            }

            // console.log(test.format() + ': ' + update.BookingStatus + ' - ' + (found &&
            // found.BookingStatus));
            if (found && satisfiesFilters && statuses[testStatus]) {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);
                if (merged.BookingStatus == "OnRoute") {
                    merged.$eta = "ETA: Calculating...";
                    merged.$etaDesc = "Calculating ETA to Pickup";
                }
                if (merged.BookingStatus == "InProgress") {
                    merged.$eta = "ETA: Calculating...";
                    merged.$etaDesc = "Calculating ETA to DropOff"
                }
                //console.log('replaced')
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'Completed' && found.BookingStatus != 'Completed') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCompleted = true;
                //console.log('recently completed - replaced');

                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'COA' && found.BookingStatus != 'COA') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCancelled = true;
                //console.log('recently completed - replaced');
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && satisfiesFilters && testStatus == 'Cancelled' && found.BookingStatus != 'Cancelled') {
                var merged = new Model.Booking(angular.extend({}, found, update));
                merged.$selected = selected;
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                merged.$pre = isPreBooking(merged);

                merged.$recentlyCancelled = true;
                //console.log('recently completed - replaced');

                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1, merged);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (found && (!satisfiesFilters || !statuses[testStatus])) {
                //console.log('removed')
                var index = $scope
                    .dispatchObj
                    .bookings
                    .items
                    .indexOf(found);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .splice(index, 1);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (satisfiesFilters && statuses[testStatus] && testStatus == 'Incoming' && moment(update.CreationTime).isAfter(new moment().subtract(2, 'minute'))) {
                //console.log('added')
                var entity = new Model.Booking(update);
                entity.$new = true;
                entity.$pre = isPreBooking(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .push(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            } else if (satisfiesFilters && statuses[testStatus]) {
                //console.log('added')
                var entity = new Model.Booking(update);
                entity.$pre = isPreBooking(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .items
                    .push(entity);
                $scope
                    .dispatchObj
                    .bookings
                    .formatBookings($scope.dispatchObj.bookings.items);
            }

            $scope
                .dispatchObj
                .bookings
                .formatBookings($scope.dispatchObj.bookings.items);
            $scope
                .dispatchObj
                .map
                .updateBookingMarkers();
            $scope
                .dispatchObj
                .map
                .updateFocus();

            console.log('onUpdateBookingStatus - $scope.$apply');
            $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
            $scope.$apply();
        }

        function onUpdateBookingOffer(event, args) {

            var update = args[0];
            var found = $scope
                .dispatchObj
                .bookings
                .items
                .filter(function (d) {
                    return d.Id == update.BookingId;
                })[0];

            if (found) {
                found.$offer = update;
                console.log('onUpdateBookingOffer - $scope.$apply');
                $scope.dispatchObj.bookings.reload = $scope.dispatchObj.bookings.reload + 1;
                $scope.$apply();
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

        function onUpdateDriverLocation(event, args) {
            var update = args[0];
            var found = $scope
                .dispatchObj
                .drivers
                .items
                .filter(function (d) {
                    return d.DriverId == update.DriverId
                })[0];

            if (found) {
                found.LastKnownLatitude = update.Latitude;
                found.LastKnownLongitude = update.Longitude;

                if ($scope.dispatchObj.selectedDriver == found) {
                    $scope
                        .map
                        .panTo(new google.maps.LatLng(update.Latitude, update.Longitude));
                }

                if ($scope.dispatchObj.map.driverMarkers[update.DriverId]) {
                    $scope
                        .dispatchObj
                        .map
                        .driverMarkers[update.DriverId]
                        .setPosition(new google.maps.LatLng(update.Latitude, update.Longitude));
                } else {
                    $scope.dispatchObj.map.driverMarkers[update.DriverId] = $scope
                        .dispatchObj
                        .map
                        .getMarkerForDriver(found);
                }



                $scope.dispatchObj.drivers.reload = $scope.dispatchObj.drivers.reload + 1;
                // $scope.dispatchObj.map.updateFocus(); if
                // ($scope.dispatchObj.drivers.selectedDriverId == update.DriverId &&
                // !$scope.dispatchObj.selectedBooking) {
                // $scope.dispatchObj.map.mapObject.panTo(new google.maps.LatLng(update.Latitude,
                // update.Longitude));    $scope.dispatchObj.map.mapObject.setZoom(16); }
                // $scope.$apply();
            }
        }

        function fetchPartnerDrivers() {
            $http
                .get($config.API_ENDPOINT + 'api/partners/drivers')
                .success(function (data) {
                    $scope.dispatchObj.partnerDrivers.items.length = 0;
                    $timeout(function () {
                        $scope.dispatchObj.partnerDrivers.items = data;
                        $scope
                            .dispatchObj
                            .map
                            .updatePartnerDriverMarkers();
                        $scope
                            .dispatchObj
                            .map
                            .updateFocus();
                    }, 0);
                })
        }

        function onUpdatePartnerDriverLocations(event, args) {
            var data = args[0];
            $scope.dispatchObj.partnerDrivers.items.length = 0;
            $timeout(function () {
                $scope.dispatchObj.partnerDrivers.items = data;
                $scope
                    .dispatchObj
                    .map
                    .updatePartnerDriverMarkers();
                $scope
                    .dispatchObj
                    .map
                    .updateFocus();
            }, 0);
        }

        function _getStoredOrDefaultFilters() {
            var filterDefaults = {
                fromSpan: -60 * 60 * 1,
                toSpan: 60 * 60 * 2,
                bookingStatuses: {
                    Unconfirmed: true,
                    Cancelled: false,
                    Incoming: true,
                    PreAllocated: true,
                    Allocated: true,
                    OnRoute: true,
                    InProgress: true,
                    Arrived: true,
                    Clearing: true,
                    Completed: false,
                    OpenToBid: true,
                },
                driverStatuses: {
                    Offline: false,
                    OnBreak: true,
                    OnJob: true,
                    Clearing: true,
                    Available: true
                }
            };

            var storedFilters = null;
            var storedText = sessionStorage.getItem('CAB9_DISPATCH_FILTERS');
            if (storedText) {
                try {
                    storedFilters = JSON.parse(storedText);
                    storedFilters.bookingStatuses.Unconfirmed = true;
                } catch (e) {
                    sessionStorage.removeItem('CAB9_DISPATCH_FILTERS');
                    storedFilters = null;
                }
            }

            return storedFilters || filterDefaults;
        }


        $(".content-area").resizable({
            handles: "e"
        });
        $('.content-area').resize(function () {
            $('.map-area').css({
                left: $(".content-area").width()
            });
        });
        // $('.map-area').draggable().resizable();
        // $(".map-area").click(function() {
        //     window.open($(this).attr("href"), '_blank');
        // });
        // $(window).resize(function() {
        //     $('.map-area').width($("#dispatch").width() - $(".content-area").width());
        //     $('.content-area').height($("#dispatch").height());
        // });

    }
})(angular);