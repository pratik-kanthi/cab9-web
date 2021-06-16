(function () {
    var module = angular.module('cab9.reports');
    module.filter('periodFormatFilter', ['$filter', function ($filter) {
        return function (value, periodFormat) {
            if (!value) return '';
            else {
                if (periodFormat == "Q YYYY")
                    return "Q" + moment(value).format(periodFormat);
                else if (periodFormat == "DD/MM")
                    return $filter('date')(moment(value).toDate(), 'shortDate');
                else
                    return moment(value).format(periodFormat);
            }
        };
    }]);
    module.directive('clientBookingStats', ['$q', '$parse', '$timeout', '$http', '$rootScope', '$UI', 'reports', 'CSV', '$filter',
    function ($q, $parse, $timeout, $http, $rootScope, $UI, reports, CSV, $filter) {
            return {
                templateUrl: '/webapp/common/reports/client-bookings-report/report.bookings.html',
                scope: true,
                link: function (scope, element, attrs) {
                    var format = scope.DATETIME_FORMAT.replace(/[.|/|-][y|Y][y|Y]*/g, '');
                    scope.deferred = null;
                    var updateDebounce = null;
                    var currentRequest = null;
                    scope.refresh = recalculate;
                    scope.bookingsDownload = bookingsDownload;
                    var query = "";
                    var dataset = {
                        label: 'Bookings',
                        data: []
                    };
                    scope.bookingsData = [dataset];
                    scope.bookingsOptions = null;
                    var normalOptions = {
                        series: {
                            shadowSize: 0,
                            bars: {
                                show: "true"
                            },
                            stack: true
                        },
                        bars: {
                            align: "center",
                            fill: 1,
                            barWidth: 24 * 60 * 60 * 600,
                        },
                        legend: {
                            margin: [0, -60],
                        },
                        grid: {
                            backgroundColor: {
                                colors: ["#fff", "#fff"]
                            },
                            borderWidth: 0,
                            hoverable: true,
                            color: '#bbb'
                        },
                        tooltip: true,
                        tooltipOpts: {
                            content: function (label, x, y) {
                                return "<small>" + $filter('date')(moment(x).toDate(), 'shortDate') + "</small><br /> <strong>%s</strong> %y"
                            },
                            defaultTheme: false
                        },
                        colors: [$UI.COLOURS.brandPrimary],
                        xaxis: {
                            show: true,
                            mode: "time",
                            minTickSize: [1, 'hour'],
                            tickFormatter: function (val, axis) {
                                if (scope.periodFormat == 'DD/MM') {
                                    var d = $filter('date')(moment(val).toDate(), format);
                                    return d;
                                } else {
                                    var d = moment(val).format(scope.periodFormat);;
                                    if (scope.periodFormat == "Q YYYY")
                                        d = "Q" + d;
                                    return d
                                }
                            }
                        },
                        yaxis: {
                            minTickSize: 1,
                            show: true,
                            tickFormatter: function (val, axis) {
                                return Math.abs(Number(val)) >= 1.0e+9 ? Math.abs(Number(val)) / 1.0e+9 + "b" : Math.abs(Number(val)) >= 1.0e+6 ? Math.abs(Number(val)) / 1.0e+6 + "m" : Math.abs(Number(val)) >= 1.0e+3 ? Math.abs(Number(val)) / 1.0e+3 + "k" : Math.abs(Number(val));

                            }
                        },
                    };
                    recalculate();
                    scope.$on('fetchData', function () {
                        recalculate();
                    })
                    scope.data = [];

                    function recalculate() {
                        scope.deferred = $q.defer();
                        dataset.data.length = 0;
                        query = reports.getQuery();
                        query = query.substr(0, query.length - 1);
                        console.log(query);
                        currentRequest = $http.get($config.API_ENDPOINT + 'api/reports/booking?' + query);
                        currentRequest.success(onDataProtected(currentRequest));
                        currentRequest.error(onError);
                    }

                    function bookingsDownload() {
                        CSV.download(scope.bookingsGroupData.map(function (item) {
                            return {
                                Period: moment(item.Period).format('DD/MM/YYYY'),
                                Bookings: item.ActualCost,
                                ActualCost: item.Cost,
                                InvoiceCost: item.InvoiceCost,
                                CashBookingsCount: item.CashBookingsCount,
                                CashBookingsCost: item.CashBookingsCost,
                                AccountBookingsCount: item.AccountBookingsCount,
                                AccountBookingsCost: item.AccountBookingsCost,
                                CancelledBookingsCount: item.CancelBookingsCount,
                                CancelledBookingsCost: item.CancelBookingsCost
                            }
                        }), 'BookingsReport');
                    }

                    function onDataProtected(request) {
                        var cr = request;
                        return function (data) {
                            if (cr !== currentRequest) {
                                return;
                            }
                            scope.bookingsOptions = normalOptions;
                            dataset.data.length = 0;
                            angular.forEach(data.Grouped, function (dp, index) {
                                dataset.data.push([new moment(dp.Period.slice(0, 10)).valueOf(), dp.Bookings]);
                            });
                            scope.periodFormat = getFormat(data.Parameters.PeriodLength);
                            scope.bookingsGroupData = data.Grouped;
                            scope.totals = data.Totals;
                            scope.deferred.resolve(true);
                        }
                    }

                    function getFormat(period) {
                        if (period == "yy")
                            return "YYYY";
                        else if (period == "mm")
                            return "MMM YY";
                        else if (period == "qq")
                            return "Q YYYY";
                        else if (period == "hh")
                            return "HH:mm"
                        else
                            return "DD/MM";
                    }

                    function onError(error) {
                        scope.deferred.reject('An Error Occured');
                    }
                }
            };
        }
    ]);
}());