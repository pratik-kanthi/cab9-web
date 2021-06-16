(function () {
    var module = angular.module('cab9.reports');

    module.directive('paymenttypeStats', ['$q', '$parse', '$timeout', '$http', '$rootScope', '$UI', 'reports', 'CSV', '$config',
        function ($q, $parse, $timeout, $http, $rootScope, $UI, reports, CSV, $config) {
            return {
                templateUrl: '/webapp/common/reports/paymentType-report/report.paymentType.html',
                link: function (scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    var currentRequest = null;
                    scope.refresh = recalculate;
                    scope.paymentTypeDownload = paymentTypeDownload;
                    var query = "";
                    var dataset = {
                        label: 'Bookings',
                        data: null
                    };
                    scope.paymentTypeData = [];
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
                        var slice = scope.paymentTypeGroupData.filter(function (item) {
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
                        scope.paymentTypeChartOptions = normalOptions;
                        query = reports.getQuery();
                        query = query.substr(0, query.length - 1);
                        currentRequest = $http.get($config.API_ENDPOINT + 'api/reports/booking?' + query + '&GroupByEntity=PaymentMethod');
                        currentRequest.success(onDataProtected(currentRequest));
                        currentRequest.error(onError);
                    }

                    function paymentTypeDownload() {
                        CSV.download(scope.paymentTypeGroupData.map(function (item) {
                            return {
                                Name: item.Name,
                                Bookings: item.Bookings,
                                ActualCost: item.ActualCost,
                                InvoiceCost: item.InvoiceCost,
                            }
                        }), 'PaymentTypeReport');
                    }

                    function onDataProtected(request) {
                        var cr = request;
                        return function (data) {
                            if (cr !== currentRequest) {
                                return;
                            }
                            scope.paymentTypeChartOptions = normalOptions;
                            dataset.data = null;
                            scope.paymentTypeData = [];
                            angular.forEach(data.Grouped, function (dp, index) {
                                scope.paymentTypeData.push({
                                    label: dp.Name,
                                    data: dp.Bookings
                                })
                            });
                            scope.paymentTypeGroupData = data.Grouped;
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