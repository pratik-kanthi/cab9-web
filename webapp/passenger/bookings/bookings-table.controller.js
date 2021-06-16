(function (angular) {
    var module = angular.module('cab9.passenger.bookings');

    module.controller('BookingsTableController', bookingsTableController);

    bookingsTableController.$inject = ['$scope', 'Model', '$q', '$config', '$filter', '$modal', '$http'];

    function bookingsTableController($scope, Model, $q, $config, $filter, $modal, $http) {
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {
            $: ""
        };
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null
        };

        $scope.setPage = setPage;
        $scope.filter = {
            date: {
                from: new Date(new moment().startOf("day")),
                to: new Date(new moment().add(3, "months"))
            },
            ShowCompletedBookings: false
        };

        $scope.setPage = setPage;

        $scope.bookingGroups = [];
        $scope.showFilterModal = showFilterModal;

        function setPage(page) {
            $scope.bookingGroups = [];
            $scope.paging.currentPage = page;
            if ($scope.searchTerm.$.length > 0) {
                $http.get($config.API_ENDPOINT + 'api/booking', {
                        params: {
                            search: $scope.searchTerm.$,
                            $expand: 'Driver,Client,Vehicle,BookingStops,LeadPassenger,Currency,BookingRequirements',
                            $top: 20,
                            $skip: $scope.paging.resultsPerPage * ($scope.paging.currentPage - 1),
                            $orderby: 'BookedDateTime desc'
                        }
                    })
                    .success(function (data) {
                        var bookings = [];
                        [].push.apply(bookings, data.map(function (b) {
                            return new Model.Booking(b);
                        }));
                        formatBookings(bookings);
                    });
            } else {
                var bookingQuery = Model.Booking
                    .query()
                    .trackingEnabled()
                    .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.filter.date.from).startOf('day').format() + "'")
                    .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.filter.date.to).endOf('day').format() + "'")
                    .filter('LeadPassengerId', '==', "guid'" + $scope.PASSENGERID + "'")
                    .include('Driver,Client,Vehicle,BookingStops,LeadPassenger,Currency,BookingRequirements')
                    .select('Id,DriverId,ClientId,VehicleId,LeadPassengerId,Currency,CurrencyRate, Tax, BookedDateTime,' +
                        'Driver/Firstname,Driver/Surname,Driver/Callsign,Driver/ImageUrl,Driver/Email,' +
                        'Client/Name,Client/ImageUrl,Client/Email,' +
                        'Vehicle/Class,Vehicle/Registration,Vehicle/Colour,Vehicle/Make,Vehicle/Model,Vehicle/Registration,' +
                        'BookingStops/StopSummary,BookingStops/WaitTime,BookingStops/WaitTimeChargable,BookingStops/Address1,BookingStops/StopOrder,BookingStops/Address2,BookingStops/Area,BookingStops/TownCity,BookingStops/County,BookingStops/Postcode,BookingStops/Country,BookingStops/Latitude,BookingStops/Longitude,' +
                        'LeadPassenger/Firstname,LeadPassenger/Surname,LeadPassenger/Mobile,LeadPassenger/ImageUrl,LeadPassenger/Email')
                    .skip($scope.paging.resultsPerPage * ($scope.paging.currentPage - 1))
                    .top($scope.paging.resultsPerPage)
                    .orderBy('BookedDateTime desc');

                bookingQuery
                    .execute()
                    .then(function (results) {
                        formatBookings(results);
                        generateFilterSummary();
                    }, function (error) {
                        swal("Error", "Please try again or contact admin", "error");
                    });
            }
        }

        $scope.$watchGroup(['filter', 'searchTerm.$'], function (newValue, oldValue) {
            $scope.bookingGroups.length = 0;
            $scope.fetchStatus = "Fetching";
            if (newValue[1]) {
                $scope.filterSummary = "Searching Bookings for : '" + newValue[1] + "'";
                $http.get($config.API_ENDPOINT + 'api/search', {
                        params: {
                            searchText: newValue[1],
                            $select: 'Id'
                        }
                    })
                    .success(function (data) {
                        $scope.paging.totalResults = data.length;
                        $scope.filterSummary = "Showing Bookings for : '" + newValue[1] + "'";
                        $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                        setPage(1);
                    });
            } else {
                generateFilterSummary();
                var statusFilter = null;
                if ($scope.filter.ShowCompletedBookings)
                    statusFilter = '==';
                else
                    statusFilter = '!=';

                var bookingQuery = Model.Booking
                    .query()
                    .select('Id')
                    .parseAs(function (data) {
                        this.Id = data.Id;
                    })
                    .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.filter.date.from).startOf('day').format() + "'")
                    .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.filter.date.to).endOf('day').format() + "'")
                    .filter('LeadPassengerId', '==', "guid'" + $scope.PASSENGERID + "'")

                bookingQuery.execute().then(function (results) {
                    $scope.paging.totalResults = results.length;
                    $scope.fetchStatus = "Showing " + results.length;
                    generateFilterSummary();
                    $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                    setPage(1);
                }, function (error) {
                    swal("Error", "Please try again or contact admin", "error");
                });
            }
        });

        function formatBookings(bookings) {
            if (bookings.length > 0) {
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
                console.log
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

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/passenger/bookings/modals/filter.modal.partial.html',
                controller: ['$scope', 'rFilter', '$modalInstance', function ($scope, rFilter, $modalInstance) {
                    $scope.filterOptions = angular.copy(rFilter);

                    $scope.datePickers = {
                        from: false,
                        to: false
                    }

                    $scope.openDatePicker = function ($event, type) {
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
                    rFilter: function () {
                        return $scope.filter;
                    },
                }
            }).result.then(function (result) {
                $scope.filter = result;
            });
        }

        $scope.drivers = [];
        $scope.vehicles = [];

        Model.Driver
            .query()
            .execute()
            .then(function (data) {
                $scope.drivers = data;
            });

        Model.Vehicle
            .query()
            .execute()
            .then(function (data) {
                $scope.vehicles = data;
            });


    }
}(angular));