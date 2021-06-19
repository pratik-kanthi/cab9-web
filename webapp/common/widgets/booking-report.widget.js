(function(window) {
    var module = angular.module('cab9.widgets', []);

    module.directive('bookingReport', ['Model', '$UI', '$config', '$http', '$q', '$filter', '$timeout', '$rootScope',
        function(Model, $UI, $config, $http, $q, $filter, $timeout, $rootScope) {
            return {
                templateUrl: '/webapp/common/widgets/booking-report.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;

                    scope.totalBookings = 0;
                    scope.totalAmount = 0;
                    scope.uniqueDrivers = 0;
                    scope.uniquePassengers = 0;

                    scope.refresh = recalculate;
                    scope.USER = $rootScope.USER;

                    scope.$watchCollection(
                        'filters',
                        function() {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 500);
                        });
                    scope.bookingGraph = {
                        options: {
                            series: {
                                bars: {
                                    show: "true"
                                },
                                shadowSize: 0,
                                stack: true
                            },
                            bars: {
                                align: "center",
                                fill: 1,
                                barWidth: 24 * 60 * 60 * 400
                            },
                            legend: {
                                show: false
                            },
                            grid: {
                                hoverable: true,
                                clickable: true,
                                tickColor: '#1b3952',
                                borderWidth: 0,
                                horizontalLines: false
                            },
                            colors: ["#a88adc"],
                            xaxis: {
                                mode: "time",
                                tickFormatter: function(val, axis) {
                                    var d = $filter('date')(moment(val).toDate(), scope.filters.format);
                                    return d;
                                },
                                minTickSize: [1, "day"],
                                tickLength: 0

                            },
                            tooltip: true,
                            tooltipOpts: {
                                content: function(label, xval, yval, flotItem) {
                                    content = new moment(xval).format("ddd") + ", <small>%x</small><br/><strong>%s</strong> %y";
                                    return content;
                                },
                                //     content: "<small>%x</small><br /> <strong>%s</strong> %ymin",
                                xDateFormat: "%d-%m-%Y",
                                defaultTheme: false
                            },
                            yaxis: {
                                min: 0,
                                position: "right",
                                minTickSize: 1
                            },
                        },
                        data: []
                    };

                    function recalculate() {
                        scope.deferred = $q.defer();
                        scope.bookingGraph.data.length = 0;
                        scope.totalBookings = 0;
                        scope.totalAmount = 0;
                        scope.uniqueDrivers = 0;
                        scope.uniquePassengers = 0;
                        var count = 0;
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to
                            }
                        }).then(function(result) {
                            scope.totalBookings = result.data.Totals.TotalBookings;
                            scope.totalAmount = result.data.Totals.TotalActualCost;
                            count += 1;
                            if (count == 3) {
                                scope.deferred.resolve(true);
                            }
                        }, function(error) {
                            scope.deferred.reject('An Error Occured');
                        });

                        $http({
                                url: $config.API_ENDPOINT + '/api/reports/booking',
                                method: 'GET',
                                params: {
                                    from: scope.filters.from,
                                    to: scope.filters.to,
                                }
                            })
                            .then(function(results) {
                                var bookingData = results.data;

                                var bookingCountData = {
                                    label: 'Bookings',
                                    data: []
                                };

                                scope.bookingGraph.data.push(bookingCountData);

                                for (var i = 0; i < bookingData.Grouped.length; i++) {
                                    var thisD = bookingData.Grouped[i];
                                    bookingCountData.data.push([new moment(thisD.Period).valueOf(), thisD.Bookings]);
                                }
                                Model.Driver
                                    .query()
                                    .select('Id')
                                    .execute()
                                    .then(function(data) {
                                        scope.driverCount = data.length;
                                        Model.Vehicle
                                            .query()
                                            .select('Id')
                                            .execute()
                                            .then(function(data) {
                                                scope.vehicleCount = data.length;
                                                count += 1;
                                                if (count == 3) {
                                                    scope.deferred.resolve(true);
                                                }
                                            });
                                    });

                            }, function(error) {
                                scope.deferred.reject('An Error Occured');
                            });

                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                groupbyentity: 'DriverId'
                            }
                        }).then(function(result) {
                            scope.uniqueDrivers = result.data.Grouped.length;
                            $http({
                                url: $config.API_ENDPOINT + 'api/reports/booking',
                                method: 'GET',
                                params: {
                                    from: scope.filters.from,
                                    to: scope.filters.to,
                                    groupbyentity: 'LeadPassengerId'
                                }
                            }).then(function(result) {
                                scope.uniquePassengers = result.data.Grouped.length;
                                count += 1;
                                if (count == 3) {
                                    scope.deferred.resolve(true);
                                }
                            }, function(error) {
                                scope.deferred.reject('An Error Occured');
                            });
                        }, function(error) {
                            scope.deferred.reject('An Error Occured');
                        });
                    }

                }
            };
        }
    ]);
}(window));