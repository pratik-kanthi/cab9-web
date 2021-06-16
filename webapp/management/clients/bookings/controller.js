(function(angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientBookingsController', clientBookingsController);

    clientBookingsController.$inject = ['$scope', 'CSV', '$modal', '$http', '$state', '$filter', '$stateParams', 'Model', '$UI', '$q', 'Auth'];

    function clientBookingsController($scope, CSV, $modal, $http, $state, $filter, $stateParams, Model, $UI, $q, Auth) {
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {
            $: ""
        };
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 50,
            totalResults: null,
            maxPages: null
        };

        $scope.setPage = setPage;
        $scope.selectedPeriod = "Today";
        $scope.filter = {
            date: {
                from: moment().startOf("day"),
                to: moment().endOf("day"),
                span: 'day',
                selectedPeriod: "Today"
            },
            Amount: {
                from: null,
                to: null,
            },
            // Clients: [],
            Drivers: [],
            VehicleTypes: [],
            Passengers: [],
            ClientId: $stateParams.Id,
            ClientIds: [$stateParams.Id],
            DriverIds: [],
            VehicleTypeIds: [],
            LeadPassengerIds: [],
            ShowCompletedBookings: false,
            ShowClientServicesBookings: false,
            Status: null,
            $inc: 0
        };
        $scope.onCompleted = function(groupIndex, index) {
            if ($scope.bookingGroups[groupIndex].bookings.length == 1)
                $scope.bookingGroups.splice(groupIndex, 1);
            else
                $scope.bookingGroups[groupIndex].bookings.splice(index, 1);
        }

        $scope.bookingGroups = [];
        $scope.showFilterModal = showFilterModal;
        $scope.exportBookings = exportBookings;

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/management/bookings/modals/filter.modal.partial.html',
                // controller: ['$scope', 'rFilter', '$modalInstance', 'rVehicleTypes', 'rClients', 'rDrivers', function ($scope, rFilter, $modalInstance, rVehicleTypes, rClients, rDrivers) {
                controller: ['$scope', 'rFilter', '$modalInstance', 'Model', function($scope, rFilter, $modalInstance, Model) {
                    $scope.filterOptions = angular.copy(rFilter);
                    // $scope.clients = $scope.filterOptions.Clients;
                    $scope.vehicleTypes = $scope.filterOptions.VehicleTypes;
                    $scope.drivers = $scope.filterOptions.Drivers;
                    $scope.passengers = $scope.filterOptions.Passengers;
                    $scope.searchDrivers = searchDrivers;
                    $scope.searchPassengers = searchPassengers;
                    $scope.saveSelected = saveSelected;

                    function saveSelected(selected, filter) {
                        $scope.filterOptions[filter] = selected;
                    }

                    function searchDrivers(searchText) {
                        if (!searchText)
                            return;
                        $scope.loadingDrivers = true;
                        $http.get($config.API_ENDPOINT + "api/Drivers/Search", {
                            params: {
                                searchText: searchText,
                                lite: true
                            }
                        }).then(function(response) {
                            $scope.drivers = [];
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i];
                                if ($scope.filterOptions.DriverIds.indexOf(item.Id) == -1)
                                    $scope.drivers.push({
                                        Id: item.Id,
                                        Name: item.Firstname + ' ' + item.Surname + ' (' + item.Callsign + ')',
                                        Description: item.DriverType.Name
                                    });
                            }
                            $scope.loadingDrivers = false;

                        });
                    }

                    function searchPassengers(searchText) {
                        if (!searchText)
                            return;
                        $scope.loadingPassengers = true;
                        $http.get($config.API_ENDPOINT + "api/Passengers/Search", {
                            params: {
                                searchText: searchText,
                                clientId: $scope.filterOptions.ClientId,
                                lite: true
                            }
                        }).then(function(response) {
                            $scope.passengers = [];
                            for (var i = 0; i < response.data.length; i++) {
                                var item = response.data[i];
                                if ($scope.filterOptions.LeadPassengerIds.indexOf(item.Id) == -1)
                                    $scope.passengers.push({
                                        Id: item.Id,
                                        Firstname: item.Firstname,
                                        Surname: item.Surname
                                    });
                            }
                            $scope.loadingPassengers = false;
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

                    $scope.status = {};
                    $scope.bookingSources = [
                        { Id: 'APP', Name: 'Mobile App', Description: '' },
                        { Id: 'WEB', Name: 'Web Application', Description: '' },
                        { Id: 'PHONE', Name: 'Phone', Description: '' },
                        { Id: 'OTHER', Name: 'Other', Description: '' },
                        { Id: 'ONETRANSPORT', Name: 'One Transport', Description: '' },
                        { Id: 'CLIENT_PORTAL', Name: 'Client Portal', Description: '' }
                    ];

                    setTimeout(function() {
                        $scope.hideClient = true;
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
                                $scope.filterOptions.date.selectedPeriod = " (" + moment($scope.filterOptions.date.from).format('DD/MM/YYYY') + " - " + moment($scope.filterOptions.date.to).format('DD/MM/YYYY') + ")";
                            }
                            $scope.$apply();
                        });
                    }, 100)

                    $scope.datePickers = {
                        from: false,
                        to: false
                    }

                    $scope.openDatePicker = function($event, type) {
                        $scope.datePickers[type] = !$scope.datePickers[type];
                        event.preventDefault();
                        event.stopPropagation();
                    }

                    $scope.confirmFilters = confirmFilters;

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

        function setPage(page) {
            $scope.bookingGroups = [];
            $scope.paging.currentPage = page;

            // var bookingQuery = Model.Booking
            //     .query()
            //     .trackingEnabled()
            //     .filter('ClientId', 'eq', "guid'" + $stateParams.Id + "'")
            //     .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.filter.date.from).startOf('day').format() + "'")
            //     .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.filter.date.to).endOf('day').format() + "'")
            //     .include('Driver,Client,Vehicle,VehicleType,BookingStops,LeadPassenger,Currency,BookingRequirements,ClientStaff,CreationUser,ModificationUser')
            //     .select('Id,LocalId,DriverId,PassengerNotificationPhone,BookingStatus,WaitingTime,ClientId,VehicleId,EstimatedDistance,VehicleTypeId,Pax,Bax,LeadPassengerId,DriverNotes,PassengerNotes,OfficeNotes,CreationTime,Currency,CurrencyRate, Tax, ActualCost,BookedDateTime,ImageUrl,' +
            //         'Driver/Firstname,Driver/Surname,Driver/Callsign,Driver/ImageUrl,' +
            //         'Client/Name,Client/ImageUrl,Client/Phone,ClientStaff,Dispute,' +
            //         'Vehicle/Class,Vehicle/Registration,Vehicle/Colour,Vehicle/Make,Vehicle/Model,Vehicle/Registration,VehicleType/Name,' +
            //         'BookingStops/StopSummary,BookingStops/WaitTime,BookingStops/WaitTimeChargable,BookingStops/Address1,BookingStops/StopOrder,BookingStops/Address2,BookingStops/Area,BookingStops/TownCity,BookingStops/County,BookingStops/Postcode,BookingStops/Country,BookingStops/Latitude,BookingStops/Longitude,' +
            //         'LeadPassenger/Firstname,LeadPassenger/Surname,LeadPassenger/Mobile,LeadPassenger/ImageUrl,CreationUser/Name,ModificationUser/Name')
            //     .skip($scope.paging.resultsPerPage * ($scope.paging.currentPage - 1))
            //     .top($scope.paging.resultsPerPage)
            //     .orderBy('BookedDateTime');

            if ($scope.searchTerm.$.length > 0) {
                $http.get($config.API_ENDPOINT + 'api/search', {
                        params: {
                            searchText: $scope.searchTerm.$,
                            clientId: $scope.filter.ClientIds[0],
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
                if ($scope.filter.DriverIds.length > 0)
                    filterObj.DriverIds = $scope.filter.DriverIds;

                if ($scope.filter.LeadPassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.LeadPassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

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

        $scope.$watchGroup(['filter.$inc', 'filter.date.from.valueOf()', 'filter.date.to.valueOf()', 'searchTerm.$', 'filter.ClientIds', 'filter.LeadPassengerIds', 'filter.VehicleTypeIds', 'filter.DriverIds', 'filter.ShowCompletedBookings', 'filter.ShowClientServicesBookings', 'filter.Status.Incoming', 'filter.Status.PreAllocated', 'filter.Status.Allocated', 'filter.Status.OnRoute', 'filter.Status.InProgress', 'filter.Status.Completed', 'filter.Status.Cancelled', 'filter.Status.COA', 'filter.Amount.from', 'filter.Amount.to', 'filter.BookingSource'], function(newValue, oldValue) {
            $scope.bookingGroups.length = 0;
            $scope.fetchStatus = "Fetching";
            if (newValue[3]) {
                $scope.filterSummary = "Searching Bookings for : '" + newValue[3] + "'";
                $http.get($config.API_ENDPOINT + 'api/search/Count', {
                        params: {
                            searchText: newValue[3],
                            clientId: $scope.filter.ClientIds[0]
                        }
                    })
                    .success(function(data) {
                        $scope.paging.totalResults = data.length;
                        $scope.filterSummary = "Showing Bookings for : '" + newValue[3] + "'";
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage(1);
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

                if ($scope.filter.DriverIds.length > 0)
                    filterObj.DriverIds = $scope.filter.DriverIds;

                if ($scope.filter.LeadPassengerIds.length > 0)
                    filterObj.LeadPassengerIds = $scope.filter.LeadPassengerIds;

                if ($scope.filter.VehicleTypeIds.length > 0)
                    filterObj.VehicleTypeIds = $scope.filter.VehicleTypeIds;

                if ($scope.filter.BookingSource)
                    filterObj.BookingSource = $scope.filter.BookingSource;

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
            if (bookings.length > 0) {
                $scope.bookingGroups.length = 0;
                var bg = {
                    date: bookings[0].BookedDateTime,
                    bookings: []
                }
                for (var i = 0; i < bookings.length; i++) {
                    var booking = bookings[i];

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

        function exportBookings() {
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

            query += "&ClientIds=" + "''" + $stateParams.Id + "''";

            if ($scope.filter.DriverIds.length > 0)
                query += "&driverIds=" + $scope.filter.DriverIds.reduce(function(prev, current) {
                    if (prev) {
                        return prev + ", ''" + current + "''";
                    } else {
                        return "''" + current + "''";
                    }
                }, null);
            if ($scope.filter.VehicleTypeIds.length > 0)
                query += "&vehicleTypeIds=" + $scope.filter.VehicleTypeIds.reduce(function(prev, current) {
                    if (prev) {
                        return prev + ", ''" + current + "''";
                    } else {
                        return "''" + current + "''";
                    }
                }, null);
            if ($scope.filter.LeadPassengerIds.length > 0)
                query += "&leadPassengerIds=" + $scope.filter.LeadPassengerIds.reduce(function(prev, current) {
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
                    }
                }
            });

            var tenant = Auth.getSession().Claims.TenantId[0];
            query += "&tenantId=" + tenant + "&BookingStatuses=" + statuses.join(',');

            window.open($config.API_ENDPOINT + 'api/bookings/export?' + query, "_blank");

            // query += "&BookingStatuses=" + statuses.join(',');
            // $http.get($config.API_ENDPOINT + 'api/bookings/export?' + query).then(function (response) {
            //     download(response.data);
            // }, function (err) {
            //     swal({
            //         title: "Some Error Occured.",
            //         text: "Some error has occured.",
            //         type: "error",
            //         confirmButtonColor: $UI.COLOURS.brandSecondary
            //     });
            // });
        }

        function download(dataset) {
            $scope.statusEnum = {
                "-1": "Cancelled",
                "0": "COA",
                "1": "Incoming",
                "5": "PreAllocated",
                "10": "Allocated",
                "20": "OnRoute",
                "30": "Arrived",
                "40": "InProgress",
                "80": "Clearing",
                "100": "Completed"
            };
            CSV.download(dataset.map(function(item) {
                delete item.BookingId
                delete item.ClientId
                delete item.PricingModelId
                delete item.TenantId
                delete item.pre_total
                delete item.VehicleTypeId
                delete item.BookedDateTime
                item.BookingStatus = $scope.statusEnum[item.BookingStatus];
                for (var p in item) {
                    if (item[p] == null) {
                        item[p] = "";
                    }
                }
                return item;
            }), "BookingsExport.csv");
        }
    }
})(angular);