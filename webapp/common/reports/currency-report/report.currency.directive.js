(function () {
    var module = angular.module('cab9.reports');

    module.directive('currencyStats', ['$q', '$parse', '$timeout', '$http', '$rootScope', '$UI', 'reports', 'CSV', '$config',
        function ($q, $parse, $timeout, $http, $rootScope, $UI, reports, CSV, $config) {
            return {
                templateUrl: '/webapp/common/reports/currency-report/report.currency.html',
                link: function (scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    var currentRequest = null;
                    scope.refresh = recalculate;
                    scope.currencyDownload = currencyDownload;
                    var query = "";
                    var dataset = {
                        label: 'Bookings',
                        data: null
                    };
                    scope.currencyData = [];
                    scope.showDriverTable = true;
                    var normalOptions = {
                        series: {
                            pie: {
                                show: true,
                                combine: {
                                    color: "#999",
                                    threshold: 0.1
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
                        var slice = scope.currencyGroupData.filter(function (item) {
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
                        scope.currencyChartOptions = normalOptions;
                        query = reports.getQuery();
                        query = query.substr(0, query.length - 1);
                        currentRequest = $http.get($config.API_ENDPOINT + 'api/reports/booking?' + query + '&GroupByEntity=CurrencyId');
                        currentRequest.success(onDataProtected(currentRequest));
                        currentRequest.error(onError);
                    }

                    function currencyDownload() {
                        CSV.download(scope.currencyGroupData.map(function (item) {
                            return {
                                Name: item.Name,
                                Bookings: item.Bookings,
                                ActualCost: item.ActualCost,
                                InvoiceCost: item.InvoiceCost,
                            }
                        }), 'CurrencyReport');
                    }

                    function onDataProtected(request) {
                        var cr = request;
                        return function (data) {
                            if (cr !== currentRequest) {
                                return;
                            }
                            scope.currencyChartOptions = normalOptions;
                            dataset.data = null;
                            scope.currencyData = [];
                            angular.forEach(data.Grouped, function (dp, index) {
                                scope.currencyData.push({
                                    label: dp.Name,
                                    data: dp.Bookings
                                })
                            });
                            scope.currencyGroupData = data.Grouped;
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