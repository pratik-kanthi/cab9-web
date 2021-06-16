(function (angular) {
    var module = angular.module('cab9.bookings');

    module.controller('BookingsTableController', bookingsTableController);

    bookingsTableController.$inject = ['$scope', 'CSV', '$UI', 'Model', '$q', '$config', '$filter', '$modal', '$http', '$stateParams', 'rDrivers', 'Auth', '$stateParams'];

    function bookingsTableController($scope, CSV, $UI, Model, $q, $config, $filter, $modal, $http, $stateParams, rDrivers, Auth, $stateParams) {
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {
            $: ""
        };

        if ($stateParams.localId) {
            $scope.searchTerm.$ = $stateParams.localId;
            $scope.showSearch = true;
        }
        $scope.drivers = rDrivers;
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 50,
            totalResults: null,
            maxPages: null
        };

        $scope.setPage = setPage;
        //        var bookingFilter = JSON.parse(sessionStorage.getItem("managementBookingFilter"));
        //        if (bookingFilter) {
        //            $scope.filter = bookingFilter;
        //        } else {
        // $scope.selectedPeriod = "Today";



        $scope.filter = _getStoredOrDefaultFilters();


        $scope.BS = ["OnRoute", "Arrived", "InProgress", "Completed", "Cancelled", "COA", "OpenToBid"];

        $scope.onCompleted = function (groupIndex, index) {
            if ($scope.bookingGroups[groupIndex].bookings.length == 1)
                $scope.bookingGroups.splice(groupIndex, 1);
            else
                $scope.bookingGroups[groupIndex].bookings.splice(index, 1);
        }

        $scope.bookingGroups = null;
        $scope.showFilterModal = showFilterModal;
        $scope.exportBookings = exportBookings;

        function setPage(page) {
            $scope.bookingGroups = null;
            $scope.paging.currentPage = page;
            if ($scope.searchTerm.$.length > 0) {
                $http.get($config.API_ENDPOINT + 'api/search', {
                        params: {
                            searchText: $scope.searchTerm.$,
                            top: 50,
                            skip: $scope.paging.resultsPerPage * ($scope.paging.currentPage - 1),
                        }
                    })
                    .success(function (data) {
                        console.log(data);
                        var bookings = [];
                        [].push.apply(bookings, data.map(function (b) {
                            return new Model.Booking(b);
                        }));
                        formatBookings(bookings);
                    });
            } else {
                var filterObj = {
                    From: new moment($scope.filter.date.from).startOf('day').format(),
                    To: new moment($scope.filter.date.to).endOf('day').format(),
                    Page: $scope.paging.currentPage
                };

                if ($scope.filter.PartnerIds.length > 0)
                    filterObj.PartnerIds = $scope.filter.PartnerIds;
                if ($scope.filter.ClientIds.length > 0)
                    filterObj.ClientIds = $scope.filter.ClientIds;

                if ($scope.filter.DriverIds.length > 0)
                    filterObj.DriverIds = $scope.filter.DriverIds;

                if ($scope.filter.LeadPassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.LeadPassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

                if ($scope.filter.PaymentMethod)
                    filterObj.PaymentMethod = $scope.filter.PaymentMethod;

                if ($scope.filter.PartnerType)
                    filterObj.PartnerType = $scope.filter.PartnerType;

                if ($scope.filter.Amount.from)
                    filterObj.AmountFrom = $scope.filter.Amount.from;

                if ($scope.filter.Amount.to)
                    filterObj.AmountTo = $scope.filter.Amount.to;

                if ($scope.filter.ShowClientServicesBookings)
                    filterObj.Dispute = true;

                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (keys[i] == "InProgress") {
                                filterObj['Arrived'] = true;
                            }
                            filterObj[keys[i]] = true;
                        }
                    }
                }

                $http.post($config.API_ENDPOINT + 'api/bookings/filtered', filterObj)
                    .success(function (data) {
                        var bookings = [];
                        [].push.apply(bookings, data.map(function (b) {
                            return new Model.Booking(b);
                        }));
                        formatBookings(bookings);
                        generateFilterSummary();
                    }).error(function (error) {
                        swal("Error", "Please try again or contact admin", "error");
                    });

            }
        }

        $scope.$watchGroup(['filter.$inc', 'filter.date.from.valueOf()', 'filter.date.to.valueOf()', 'searchTerm.$', 'filter.ClientIds', 'filter.LeadPassengerIds', 'filter.VehicleTypeIds', 'filter.DriverIds', 'filter.ShowCompletedBookings', 'filter.ShowClientServicesBookings', 'filter.Status.Incoming', 'filter.Status.PreAllocated', 'filter.Status.Allocated', 'filter.Status.OnRoute', 'filter.Status.InProgress', 'filter.Status.Completed', 'filter.Status.Cancelled', 'filter.Status.COA', 'filter.Amount.from', 'filter.Amount.to', 'filter.BookingSource', 'filter.PaymentMethod', 'filter.PartnerType'], function (newValue, oldValue) {
            $scope.bookingGroups = null;
            $scope.fetchStatus = "Fetching";
            if (newValue[3]) {
                $scope.filterSummary = "Searching Bookings for : '" + newValue[3] + "'";
                $http.get($config.API_ENDPOINT + 'api/search/Count', {
                        params: {
                            searchText: newValue[3],
                        }
                    })
                    .success(function (data) {
                        $scope.paging.totalResults = data.length;
                        $scope.filterSummary = "Showing Bookings for : '" + newValue[3] + "'";
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage($scope.paging.maxPages);
                    });
            } else {
                generateFilterSummary();
                var filterObj = {
                    From: new moment($scope.filter.date.from).startOf('day').format(),
                    To: new moment($scope.filter.date.to).endOf('day').format(),
                    Page: $scope.paging.currentPage
                };

                if ($scope.filter.PartnerIds.length > 0)
                    filterObj.PartnerIds = $scope.filter.PartnerIds;
                if ($scope.filter.ClientIds.length > 0)
                    filterObj.ClientIds = $scope.filter.ClientIds;

                if ($scope.filter.DriverIds.length > 0)
                    filterObj.DriverIds = $scope.filter.DriverIds;

                if ($scope.filter.LeadPassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.LeadPassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

                if ($scope.filter.PaymentMethod)
                    filterObj.PaymentMethod = $scope.filter.PaymentMethod;

                if ($scope.filter.PartnerType)
                    filterObj.PartnerType = $scope.filter.PartnerType;

                if ($scope.filter.Amount.from)
                    filterObj.AmountFrom = $scope.filter.Amount.from;

                if ($scope.filter.Amount.to)
                    filterObj.AmountTo = $scope.filter.Amount.to;

                if ($scope.filter.ShowClientServicesBookings)
                    filterObj.Dispute = true;

                if ($scope.filter.Status) {
                    var keys = Object.keys($scope.filter.Status)
                    for (var i = 0; i < keys.length; i++) {
                        if ($scope.filter.Status[keys[i]]) {
                            if (keys[i] == "InProgress") {
                                filterObj['Arrived'] = true;
                            }
                            filterObj[keys[i]] = true;
                        }
                    }
                }

                $http.post($config.API_ENDPOINT + 'api/bookings/FilteredCount', filterObj)
                    .success(function (data) {
                        $scope.paging.totalResults = data;
                        $scope.fetchStatus = "Showing " + data;
                        generateFilterSummary();
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage(1);
                    }).error(function (error) {
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        });

        function formatBookings(bookings) {
            $scope.bookingGroups = [];
            if (bookings.length > 0) {
                var bg = {
                    date: bookings[0].BookedDateTime,
                    day: moment(bookings[0].BookedDateTime).format('dddd'),
                    bookings: []
                }
                for (var i = 0; i < bookings.length; i++) {
                    var booking = bookings[i];

                    if (booking.FlightInfo) {
                        if (moment().diff(moment(booking.FlightInfo.LastUpdate), 'hours') > 10) {
                            booking.FlightInfo.$Status = "No updates yet."
                        } else {
                            booking.FlightInfo.$Status = "Last Updated " + moment(booking.FlightInfo.LastUpdate).fromNow();
                        }
                    }

                    booking.BookingStops = $filter('orderBy')(booking.BookingStops, 'StopOrder');
                    //                    booking.$commit();

                    if (new moment(booking.BookedDateTime).format("DD/MM/YYYY") == new moment(bg.date).format("DD/MM/YYYY")) {
                        bg.day = moment(booking.BookedDateTime).format('dddd'),
                        bg.bookings.push(booking);
                    } else {
                        $scope.bookingGroups.push(bg);
                        bg = {
                            date: booking.BookedDateTime,
                            day: moment(booking.BookedDateTime).format('dddd'),
                            bookings: []
                        }
                        bg.bookings.push(booking);
                    }
                }
                $scope.bookingGroups.push(bg);
            }
        }

        function generateFilterSummary() {
            var fromDate = new moment($scope.filter.date.from);
            var toDate = new moment($scope.filter.date.to);
            $scope.filterSummary = $scope.fetchStatus;
            if (fromDate.format('DD/MM/YYYY') == toDate.format('DD/MM/YYYY')) {
                $scope.filterSummary += " Bookings for " + $filter('date')(fromDate.toDate(), 'shortDate');
            } else {
                $scope.filterSummary += " Bookings from " + $filter('date')(fromDate.toDate(), 'shortDate') + " to " + $filter('date')(toDate.toDate(), 'shortDate');
            }
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function exportBookings(withRefs) {
            swal({
                title: "Are You Sure?",
                text: "This will initiate a booking export and the exported file will be sent to you via email.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: "#DD6B55",
                confirmButtonText: "Confirm",
                cancelButtonText: "Cancel",
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm) {
                if (isConfirm) {
                    if (!$scope.filter.date.from || !$scope.filter.date.to) {
                        swal({
                            title: "Date Range not selected.",
                            text: "Please select date range in filters to export.",
                            type: "warning",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                        return;
                    }
                    var query = "from=" + moment($scope.filter.date.from).startOf("day").format().replace('+', '%2B') + "&to=" + moment($scope.filter.date.to).endOf("day").format().replace('+', '%2B');
                    if ($scope.filter.PartnerIds.length > 0)
                        query += "&partnerids=" + $scope.filter.PartnerIds.reduce(function (prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.DriverIds.length > 0)
                        query += "&driverids=" + $scope.filter.DriverIds.reduce(function (prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.ClientIds.length > 0)
                        query += "&clientIds=" + $scope.filter.ClientIds.reduce(function (prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.VehicleTypeIds.length > 0)
                        query += "&vehicleTypeIds=" + $scope.filter.VehicleTypeIds.reduce(function (prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.LeadPassengerIds.length > 0)
                        query += "&leadPassengerIds=" + $scope.filter.LeadPassengerIds.reduce(function (prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.Amount && $scope.filter.Amount.from >= 0)
                        query += "&actualCostFrom=" + $scope.filter.Amount.from;
                    if ($scope.filter.Amount && $scope.filter.Amount.to >= 0)
                        query += "&actualCostTo=" + $scope.filter.Amount.to;
                    if ($scope.filter.ClientServices)
                        query += "&clientServices=" + 1;
                    if ($scope.filter.BookingSource)
                        query += "&bookingSource=" + $scope.filter.BookingSource;
                    if ($scope.filter.PaymentMethod)
                        query += "&paymentMethod=" + $scope.filter.PaymentMethod;
                    if ($scope.filter.PartnerType)
                        query += "&partnerType=" + $scope.filter.PartnerType;
                    var statuses = [];
                    angular.forEach($scope.filter.Status, function (value, key) {
                        if (value) {
                            switch (key) {
                                case "Cancelled":
                                    statuses.push("-1");
                                    break;
                                case "COA":
                                    statuses.push("0");
                                    break;
                                case "Incoming":
                                    statuses.push("1");
                                    break;
                                case "PreAllocated":
                                    statuses.push("5");
                                    break;
                                case "Allocated":
                                    statuses.push("10");
                                    break;
                                case "OnRoute":
                                    statuses.push("20");
                                    break;
                                case "Arrived":
                                    statuses.push("30,40");
                                    break;
                                case "InProgress":
                                    statuses.push("30,40");
                                    break;
                                case "Clearing":
                                    statuses.push("80");
                                    break;
                                case "Completed":
                                    statuses.push("100");
                                    break;
                                case "OpenToBid":
                                    statuses.push("120");
                                    break;
                            }
                        }
                    });
                    var tenant = Auth.getSession().Claims.TenantId[0];
                    query += "&tenantId=" + tenant + "&management=true&withReferences=" + withRefs + "&BookingStatuses=" + statuses.join(',');
                    $http.get(
                        $config.API_ENDPOINT + 'api/bookings/export?' + query, "_blank"
                    ).then(function (response) {
                        swal({
                            title: "Export Initiated",
                            text: "Thank you for your request, The bookings export file will be sent to you via an email in few minutes.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    }, function (error) {
                        swal({
                            title: "Some Error Occured",
                            text: error.data.Message,
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    })
                } else {
                    swal.close();
                }
            });
        }

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/management/bookings/modals/filter.modal.partial.html',
                controller: 'BookingsFilterModalController',
                resolve: {
                    rFilter: function () {
                        return $scope.filter;
                    }
                },
                size: 'lg'
            }).result.then(function (result) {
                $scope.filter = result;
                $scope.filter.$inc++;
                sessionStorage.setItem('CAB9_BOOKING_FILTERS', JSON.stringify(result));
            });
        }

        $scope.$on('SIGNALR_updateBooking', onUpdateBooking);

        function onUpdateBooking(event, args) {
            for (i = 0; i < $scope.bookingGroups.length; i++) {
                for (j = 0; j < $scope.bookingGroups[i].bookings.length; j++) {
                    var _b = $scope.bookingGroups[i].bookings[j];
                    if (args[0].Id == _b.Id) {
                        $scope.bookingGroups[i].bookings.splice(j, 1, new Model.Booking(args[0]));
                        $scope.$apply();
                    }
                }
            }
        }

        function _getStoredOrDefaultFilters() {
            var filterDefaults = {
                date: {
                    from: moment().startOf("day"),
                    to: moment().endOf("week"),
                    span: 'week',
                    selectedPeriod: "(" + moment().startOf("day").format('DD/MM/YYYY') + " - " + moment().endOf("week").format('DD/MM/YYYY') + ")"
                },
                Amount: {
                    from: null,
                    to: null,
                },
                Partners: [],
                Clients: [],
                Drivers: [],
                VehicleTypes: [],
                Passengers: [],
                ClientIds: [],
                PartnerIds: [],
                DriverIds: [],
                VehicleTypeIds: [],
                LeadPassengerIds: [],
                ShowCompletedBookings: false,
                ShowClientServicesBookings: false,
                Status: null,
                $inc: 0
            };

            var storedFilters = null;
            var storedText = sessionStorage.getItem('CAB9_BOOKING_FILTERS');
            if (storedText) {
                try {
                    storedFilters = JSON.parse(storedText);
                } catch (e) {
                    sessionStorage.removeItem('CAB9_BOOKING_FILTERS');
                    storedFilters = null;
                }
            }

            return storedFilters || filterDefaults;
        }

    }
}(angular));