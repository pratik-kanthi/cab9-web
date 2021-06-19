(function () {
    var module = angular.module('cab9.widgets');

    module.directive('bookingSourceReport', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function ($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/booking-source.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function (scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    // scope.download = download;

                    // scope.helpText = reports.help.user_stats;

                    scope.bookingSourceData = [];
                    scope.bookingSourceChartData = [];

                    scope.pieChartOptions = {
                        series: {
                            pie: {
                                show: true,
                                innerRadius: 0.5,
                                combine: {
                                    color: "#999",
                                    threshold: 0.1
                                }
                            }
                        },
                        colors: [$UI.COLOURS.brandPrimary, $UI.COLOURS.brandSecondary, $UI.COLOURS.orange, $UI.COLOURS.sky, $UI.COLOURS.grey],
                        tooltip: {
                            show: true,
                            content: getToolTipData,
                            shifts: {
                                x: 25,
                                y: 0
                            },
                            defaultTheme: false
                        },
                        grid: {
                            hoverable: true
                        },
                    };

                    scope.$watchCollection(
                        'filters',
                        function () {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 500);
                        });

                    function getToolTipData(label, xval, yval, flotItem) {
                        var slice = scope.bookingSourceData.filter(function (item) {
                            return item.Name == label
                        })[0];
                        var cost = 0;
                        if (slice) {
                            return "<div style='font-size:9pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + yval.toString() + " Bookings<br/><strong>" + slice.ActualCost + " </strong></div>";
                        } else
                            return "";
                    }



                    function recalculate() {
                        scope.deferred = $q.defer();
                        scope.bookingSourceData = [];
                        scope.bookingSourceChartData = [];
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                groupbyentity: 'BookingSource'
                            }
                        }).then(function (result) {
                            scope.bookingSourceData = result.data.Grouped;
                            angular.forEach(result.data.Grouped, function (dp, index) {
                                scope.bookingSourceChartData.push({
                                    label: dp.Name,
                                    data: dp.Bookings
                                })
                            });
                            scope.deferred.resolve(true);
                        }, function (error) {
                            scope.deferred.reject('An Error Occured');
                        });
                    }


                    // function download() {
                    //     var summary = reports.getFileName(scope.filters);
                    //     CSV.download(dataset.data.map(function(d) {
                    //         return {
                    //             date: new moment.utc(d[0]).format('DD/MM/YYYY HH:mm'),
                    //             value: d[1]
                    //         }
                    //     }), 'user-stats' + summary);
                    // }

                }
            };
        }
    ]);
}());