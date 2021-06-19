(function (angular) {
    var module = angular.module('cab9.driver.bookings');

    module.controller('BookingsTableController', bookingsTableController);

    bookingsTableController.$inject = ['$scope', 'Model', '$q', '$config', '$filter', '$modal', '$http'];

    function bookingsTableController($scope, Model, $q, $config, $filter, $modal, $http) {
        $scope.searchTerm = {};

        $scope.filter = {
            date: {
                from: new Date(new moment().startOf("day")),
                to: new Date(new moment().add(3, "months"))
            },
            ShowCompletedBookings: false
        };

        $scope.bookingGroups = [];
        $scope.showFilterModal = showFilterModal;

        $scope.$watchGroup(['filter', 'searchTerm.$'], function (newValue, oldValue) {
            $scope.bookingGroups.length = 0;
            $scope.fetchStatus = "Fetching";
            if (newValue[1]) {
                $scope.filterSummary = "Searching Bookings for : '" + newValue[1] + "'";
                $http.get($config.API_ENDPOINT + 'api/search', {
                    params: {
                        searchText: newValue[1]
                    }
                })
                .success(function (data) {
                    var bookings = [];
                    [].push.apply(bookings, data.map(function (b) {
                        return new Model.Booking(b);
                    }));
                    formatBookings(bookings);
                    $scope.filterSummary = "Showing Bookings for : '" + newValue[1] + "'";
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
                    .filter('BookedDateTime', 'ge', "datetimeoffset'" + new moment($scope.filter.date.from).startOf('day').format() + "'")
                    .filter('BookedDateTime', 'le', "datetimeoffset'" + new moment($scope.filter.date.to).endOf('day').format() + "'")
                    .filter('BookingStatus', statusFilter, "'Completed'")
                    .filter('DriverId', '==', "guid'" + $scope.DRIVERID + "'")
                    .include('LeadPassenger, Client, BookingStops, Driver, Vehicle, Currency')
                    .orderBy('BookedDateTime');

                bookingQuery.top(20);

                bookingQuery.execute().then(function (results) {
                    formatBookings(results);
                    $scope.fetchStatus = "Showing " + results.length;
                    generateFilterSummary();
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
                    booking.$commit();

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

        function showFilterModal() {
            $modal.open({
                templateUrl: '/webapp/driver/bookings/modals/filter.modal.partial.html',
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
                    }
                }
            }).result.then(function (result) {
                $scope.filter = result;
            });
        }
    }
}(angular));