(function () {
    var module = angular.module('cab9.reports');

    module.directive('driverStats', ['$q', '$parse', '$timeout', '$http', '$rootScope', '$UI', 'reports', 'CSV', '$config',
        function ($q, $parse, $timeout, $http, $rootScope, $UI, reports, CSV, $config) {
            return {
                templateUrl: '/webapp/common/reports/driver-report/report.driver.html',
                link: function (scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    var currentRequest = null;
                    scope.refresh = recalculate;
                    scope.driverDownload = driverDownload;
                    var query = "";
                    var dataset = {
                        label: 'Bookings',
                        data: null
                    };
                    scope.driverData = [];
                    scope.showDriverTable = true;
                    var normalOptions = {
                        series: {
                            pie: {
                                show: true,
                                combine: {
                                    color: "#999",
                                    threshold: 0.025
                                },
                                label: {
                                    threshold: 0.025
                                }
                            }
                        },
                        colors: [$UI.COLOURS.brandPrimary, $UI.COLOURS.brandSecondary],
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

                    scope.$on('fetchData', function () {
                        recalculate();
                    });

                    recalculate();

                    function getToolTipData(label, xval, yval, flotItem) {
                        var currency = scope.company.Currency;
                        var slice = scope.driverGroupData.filter(function (item) {
                            return item.Name == label
                        })[0];
                        var cost = 0;
                        if (slice) {
                            cost = slice.ActualCost;
                            return "<div style='font-size:9pt; text-align:center; padding:2px; color:white;'>" + label + "<br/>" + yval.toString() + " Bookings<br/><strong>" + cost + " " + currency + " </strong></div>";
                        } else
                            return "";
                    }

                    function recalculate() {
                        scope.deferred = $q.defer();
                        dataset.data = null;
                        scope.total = 0;
                        scope.driverChartOptions = normalOptions;
                        query = reports.getQuery();
                        query = query.substr(0, query.length - 1);
                        currentRequest = $http.get($config.API_ENDPOINT + 'api/reports/booking?' + query + '&GroupByEntity=DriverId');
                        currentRequest.success(onDataProtected(currentRequest));
                        currentRequest.error(onError);
                    }

                    function driverDownload() {
                        CSV.download(scope.driverGroupData.map(function (item) {
                            return {
                                Name: item.Name,
                                Bookings: item.Bookings,
                                ActualCost: item.ActualCost,
                                InvoiceCost: item.InvoiceCost,
                            }
                        }), 'DriverReport');
                    }

                    function onDataProtected(request) {
                        var cr = request;
                        return function (data) {
                            if (cr !== currentRequest) {
                                return;
                            }
                            scope.driverChartOptions = normalOptions;
                            dataset.data = null;
                            scope.driverData = [];
                            angular.forEach(data.Grouped, function (dp, index) {
                                scope.driverData.push({
                                    label: dp.Name,
                                    data: dp.Bookings
                                })
                            });
                            scope.driverGroupData = data.Grouped;
                            scope.company = data.Company;
                            scope.total += parseInt(data.Totals.TotalBookings);
                            scope.deferred.resolve(true);
                        }
                    }

                    function onError(error) {
                        scope.deferred.reject('An Error Occured');
                    }
                }
            };
        }
    ]);
}());