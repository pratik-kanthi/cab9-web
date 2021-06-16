(function () {
    var module = angular.module('cab9.widgets');

    module.directive('clientBookingReport', ['Model', '$UI', '$config', '$http', '$q', '$filter', '$timeout', '$rootScope',
        function (Model, $UI, $config, $http, $q, $filter, $timeout, $rootScope) {
            return {
                templateUrl: '/webapp/client/widgets/client-booking-report.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function (scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    // scope.download = download;
                    // scope.helpText = reports.help.user_stats;

                    scope.$watchCollection(
                        'filters',
                        function () {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 500);
                        });

                    scope.bookingGraph = {
                        options: {
                            series: {
                                lines: {
                                    show: true,
                                    lineWidth: 2,
                                    fill: true,
                                    fillColor: {
                                        colors: [{
                                            opacity: 0.2
                                        }, {
                                            opacity: 0.2
                                        }]
                                    }
                                },
                                points: {
                                    show: true,
                                    lineWidth: 2
                                },
                                shadowSize: 0
                            },
                            legend: {
                                show: false
                            },
                            grid: {
                                hoverable: true,
                                clickable: true,
                                tickColor: '#1BA0FC',
                                borderWidth: 0
                            },
                            colors: ["#fff"],
                            xaxis: {
                                mode: "time",
                                tickFormatter: function (val, axis) {
                                    var d = $filter('date')(moment(val).toDate(), scope.filters.format);
                                    return d;
                                },
                                minTickSize: [1, "day"],
                            },
                            tooltip: true,
                            tooltipOpts: {
                                content: function (label, xval, yval, flotItem) {
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
                        var params = {
                            from: scope.filters.from,
                            to: scope.filters.to,
                        };
                        if (scope.filters.ClientStaffIds && scope.filters.ClientStaffIds.length > 0)
                            params.ClientStaffIds = scope.filters.ClientStaffIds;
                        $http({
                                url: $config.API_ENDPOINT + '/api/reports/booking',
                                method: 'GET',
                                params: params
                            })
                            .then(function (results) {
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
                                Model.ClientStaff
                                    .query()
                                    .where("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                                    .select('Id')
                                    .execute()
                                    .then(function (data) {
                                        scope.bookerCount = data.length;
                                        Model.Passenger
                                            .query()
                                            .where("ClientId eq guid'" + $rootScope.CLIENTID + "'")
                                            .select('Id')
                                            .execute()
                                            .then(function (data) {
                                                scope.passengerCount = data.length;
                                                scope.deferred.resolve(true);
                                            });
                                    });

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