(function(angular) {
    var module = angular.module('cab9.client.bookings');

    module.controller('BookingsTableController', bookingsTableController);

    bookingsTableController.$inject = ['$scope', '$rootScope', 'CSV', '$UI', 'Model', '$q', '$config', '$filter', '$modal', 'Auth', '$http', '$stateParams'];

    function bookingsTableController($scope, $rootScope, CSV, $UI, Model, $q, $config, $filter, $modal, Auth, $http, $stateParams) {
        $scope.isAdmin = $rootScope.PERMISSIONS.role.Name.toLowerCase() == 'super admin';
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {
            $: ""
        };
        if ($stateParams.localId) {
            $scope.searchTerm.$ = $stateParams.localId;
            $scope.showSearch = true;
        }
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 50,
            totalResults: null,
            maxPages: null
        };

        $scope.setPage = setPage;
        $scope.selectedPeriod = "Today";

        $scope.filter = {
            $inc: 0,
            date: {
                from: moment().startOf("week"),
                to: moment().endOf("week"),
                span: 'week',
                selectedPeriod: "This Week"
            },
            Amount: {
                from: null,
                to: null,
            },
            Clients: [],
            Passengers: [],
            ClientStaff: [],
            VehicleTypes: [],
            ClientIds: [$scope.CLIENTID],
            PassengerIds: [],
            ClientStaffIds: [], //$scope.isAdmin ? null : Auth.getSession().Claims.ClientStaffId[0],
            VehicleTypeIds: [],
            Status: null
        };


        $scope.BS = ["OnRoute", "Arrived", "InProgress", "Completed", "Cancelled", "COA"];

        $scope.onCompleted = function(groupIndex, index) {
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
                            clientId: $scope.CLIENTID,
                            top: 50,
                            skip: $scope.paging.resultsPerPage * ($scope.paging.currentPage - 1),
                        }
                    })
                    .success(function(data) {
                        var bookings = [];
                        [].push.apply(bookings, data.map(function(b) {
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

                if ($scope.filter.ClientIds.length > 0)
                    filterObj.ClientIds = $scope.filter.ClientIds;

                if ($scope.filter.PassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.PassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

                if ($scope.filter.PaymentMethod)
                    filterObj.PaymentMethod = $scope.filter.PaymentMethod;

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
                    .success(function(data) {
                        var bookings = [];
                        [].push.apply(bookings, data.map(function(b) {
                            return new Model.Booking(b);
                        }));
                        formatBookings(bookings);
                        generateFilterSummary();
                    }).error(function(error) {
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        }

        $scope.$watchGroup(['filter.$inc', 'filter.date.from.valueOf()', 'filter.date.to.valueOf()', 'searchTerm.$', 'filter.VehicleTypeId', 'filter.PassengerId', 'filter.ClientStaffId', 'filter.Status.Incoming', 'filter.Status.PreAllocated', 'filter.Status.Allocated', 'filter.Status.OnRoute', 'filter.Status.InProgress', 'filter.Status.Completed', 'filter.Status.Cancelled', 'filter.Status.COA', 'filter.Amount.from', 'filter.Amount.to', 'filter.PaymentMethod'], function(newValue, oldValue) {
            $scope.bookingGroups = [];
            $scope.fetchStatus = "Fetching";
            if (newValue[3]) {
                $scope.filterSummary = "Searching Bookings for : '" + newValue[3] + "'";
                $http.get($config.API_ENDPOINT + 'api/search/Count', {
                        params: {
                            searchText: newValue[3],
                            clientId: $scope.CLIENTID
                        }
                    })
                    .success(function(data) {
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

                if ($scope.filter.ClientIds.length > 0)
                    filterObj.ClientIds = $scope.filter.ClientIds;

                if ($scope.filter.PassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.PassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

                if ($scope.filter.PaymentMethod)
                    filterObj.PaymentMethod = $scope.filter.PaymentMethod;

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
                    .success(function(data) {
                        $scope.paging.totalResults = data;
                        $scope.fetchStatus = "Showing " + data;
                        generateFilterSummary();
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage(1);
                    }).error(function(error) {
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        });

        function formatBookings(bookings) {
            $scope.bookingGroups = [];
            if (bookings.length > 0) {
                var bg = {
                    date: bookings[0].BookedDateTime,
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
                        bg.bookings.push(booking);
                    } else {
                        $scope.bookingGroups.push(bg);
                        bg = {
                            date: booking.BookedDateTime,
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
                setTimeout(function() {
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
            }, function(isConfirm) {
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


                    if ($scope.filter.VehicleTypeIds.length > 0)
                        query += "&vehicleTypeIds=" + $scope.filter.VehicleTypeIds.reduce(function(prev, current) {
                            if (prev) {
                                return prev + ", ''" + current + "''";
                            } else {
                                return "''" + current + "''";
                            }
                        }, null);
                    if ($scope.filter.PassengerIds.length > 0)
                        query += "&leadPassengerIds=" + $scope.filter.PassengerIds.reduce(function(prev, current) {
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
                    var statuses = [];
                    angular.forEach($scope.filter.Status, function(value, key) {
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
                    query += "&tenantId=" + tenant + "&management=false&withReferences=" + withRefs + "&BookingStatuses=" + statuses.join(',');
                    $http.get(
                        $config.API_ENDPOINT + 'api/bookings/export?' + query, "_blank"
                    ).then(function(response) {
                        swal({
                            title: "Export Initiated",
                            text: "Thank you for your request, The bookings export file will be sent to you via an email in few minutes.",
                            type: "success",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    }, function(error) {
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
                templateUrl: '/webapp/client/bookings/modals/filter.modal.partial.html',
                controller: ['$scope', 'rFilter', '$modalInstance', 'Model', function($scope, rFilter, $modalInstance, Model) {
                    $scope.isAdmin = $rootScope.PERMISSIONS.role.Name.toLowerCase() == 'super admin';
                    $scope.filterOptions = angular.copy(rFilter);
                    $scope.passengers = $scope.filterOptions.Passengers;
                    $scope.clientStaff = $scope.filterOptions.ClientStaff;
                    $scope.vehicleTypes = $scope.filterOptions.VehicleTypes;
                    $scope.datePickers = {
                        from: false,
                        to: false
                    }

                    $scope.paymentMethods = [
                        {Id: 'CASH', Name: 'Cash', Description: ''},
                        {Id: 'CARD', Name: 'Card', Description: ''},
                        {Id: 'ONACCOUNT', Name: 'OnAccount', Description: ''},
                        {Id: 'OTHER', Name: 'Other', Description: ''}
                    ];

                    $scope.status = {};
                    $scope.searchClientStaff = searchClientStaff;
                    $scope.searchPassengers = searchPassengers;
                    $scope.confirmFilters = confirmFilters;
                    $scope.saveSelected = saveSelected;

                    if (!$scope.isAdmin) {
                        Model.ClientStaff.query()
                            .filter("Id eq guid'" + Auth.getSession().Claims.ClientStaffId[0] + "'")
                            .include("Passengers")
                            .execute().then(function(response) {
                                if (response[0].AllPassengers) {
                                    $scope.allPassengers = true;
                                } else {
                                    $scope.passengers = response[0].Passengers.map(function(item) {
                                        var a = {};
                                        a.Id = item.Id;
                                        a.Name = item.Firstname + ' ' + item.Surname;
                                        a.Mobile = item.Mobile;
                                        return a;
                                    });
                                }
                            });
                    }

                    function saveSelected(selected, filter) {
                        $scope.filterOptions[filter] = selected;
                    }

                    function searchPassengers(searchText) {
                        if (!searchText)
                            return;
                        $scope.loadingPassengers = true;
                        $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                            params: {
                                searchText: searchText,
                                clientId: $scope.filterOptions.ClientIds[0],
                                lite: true
                            }
                        }).then(function(response) {
                            $scope.passengers = [];
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i];
                                if ($scope.filterOptions.PassengerIds.indexOf(item.Id) == -1)
                                    $scope.passengers.push({
                                        Id: item.Id,
                                        Firstname: item.Firstname,
                                        Surname: item.Surname
                                    });
                            }
                            $scope.loadingPassengers = false;

                        });
                    }

                    function searchClientStaff(searchText) {
                        if (!searchText)
                            return;
                        $scope.loadingClientStaff = true;
                        $http.get($config.API_ENDPOINT + "api/Bookers/Search", {
                            params: {
                                searchText: searchText,
                                clientId: $scope.filterOptions.ClientIds[0],
                                lite: true
                            }
                        }).then(function(response) {
                            $scope.clientStaff = [];
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i];
                                if ($scope.filterOptions.ClientStaffIds.indexOf(item.Id) == -1)
                                    $scope.clientStaff.push({
                                        Id: item.Id,
                                        Firstname: item.Firstname,
                                        Surname: item.Surname
                                    });
                            }
                            $scope.loadingClientStaff = false;
                        });
                    }

                    Model.VehicleType
                        .query()
                        .select('Id,Name,Description')
                        .execute().then(function(data) {
                            $scope.vehicleTypes = data;
                        });

                    window.setInterval(function() {
                        var elem = document.getElementsByClassName('.select2-choices ');
                        elem.scrollTop = elem.scrollHeight;
                    }, 5000);



                    setTimeout(function() {
                        $('#daterangepicker_bookings').daterangepicker({
                            locale: {
                                format: 'DD/MM/YYYY'
                            },
                            "autoApply": true,
                            "startDate": moment($scope.filterOptions.date.from).startOf('day'),
                            "endDate": moment($scope.filterOptions.date.to).endOf("day"),
                            "opens": "right",
                            "parentEl": "#time-controls",
                            ranges: {
                                'Today': [moment().startOf("day"), moment().endOf("day")],
                                'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                                'This Month': [moment().startOf('month'), moment().endOf('month')]
                            },
                            "alwaysShowCalendars": true,
                        });

                        $('#daterangepicker_bookings').on('apply.daterangepicker', function(ev, picker) {
                            $scope.filterOptions.date.selectedPeriod = picker.chosenLabel;
                            $scope.filterOptions.date.from = picker.startDate.toISOString();
                            $scope.filterOptions.date.to = picker.endDate.toISOString();
                            if ($scope.filterOptions.date.selectedPeriod == "Custom Range") {
                                $scope.filterOptions.date.selectedPeriod += " (" + moment($scope.filterOptions.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filterOptions.date.to).format('DD/MM/YYYY') + ")";
                            }
                            $scope.$apply();
                        });
                    }, 100);

                    $scope.openDatePicker = function($event, type) {
                        $scope.datePickers[type] = !$scope.datePickers[type];
                        event.preventDefault();
                        event.stopPropagation();
                    }


                    function confirmFilters() {
                        $modalInstance.close($scope.filterOptions);
                    }
                }],
                resolve: {
                    rFilter: function() {
                        return $scope.filter;
                    }
                },
                size: 'lg'
            }).result.then(function(result) {
                $scope.filter = result;
                $scope.filter.$inc++;
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

    }
}(angular));