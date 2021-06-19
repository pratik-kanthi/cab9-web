(function() {
    var module = angular.module('cab9.widgets');

    module.directive('driverReport', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/driver-report.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    // scope.download = download;

                    // scope.helpText = reports.help.user_stats;
                    scope.drivers = [];

                    scope.$watchCollection(
                        'filters',
                        function() {
                            if (updateDebounce) {
                                $timeout.cancel(updateDebounce);
                                updateDebounce = null;
                            }
                            updateDebounce = $timeout(recalculate, 500);
                        });

                    function recalculate() {
                        scope.deferred = $q.defer();
                        scope.drivers.length = 0;
                        scope.bestDriver = null;
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                groupbyentity: 'DriverId'
                            }
                        }).then(function(result) {
                            scope.drivers = result.data.Grouped;
                            scope.bestDriver = result.data.Grouped[0];

                            for (var i = 0; i < scope.drivers.length; i++) {
                                if (scope.drivers[i].ImageUrl && scope.drivers[i].ImageUrl[0] === 'h') {
                                    continue;
                                }
                                scope.drivers[i].ImageUrl = formatImage(scope.drivers[i].ImageUrl, scope.drivers[i].Callsign);
                            }

                            scope.deferred.resolve(true);
                            if (scope.bestDriver) {
                                $http({
                                    url: $config.API_ENDPOINT + '/api/reports/booking',
                                    method: 'GET',
                                    params: {
                                        from: scope.filters.from,
                                        to: scope.filters.to,
                                        DriverIds: "'" + scope.bestDriver.DriverId + "'",
                                        periodlength: 'dd'
                                    }
                                }).then(function(result) {
                                    var myvalues = [];
                                    angular.forEach(result.data.Grouped, function(p) {
                                        myvalues.push(p.Bookings);
                                    })
                                    var sparklineOptions = {
                                        type: 'line',
                                        lineColor: '#0491F1',
                                        fillColor: '#0783d8',
                                        width: '100%',
                                        height: '64px'
                                    };
                                    $('#driver-sparkline').sparkline(myvalues, sparklineOptions);


                                }, function(error) {
                                    // scope.deferred.reject('An Error Occured');
                                })
                            }
                            // else {
                            //     scope.deferred.resolve(true);
                            // }
                        }, function(error) {
                            scope.deferred.reject('An Error Occured');
                        });
                    }

                }
            };
        }
    ]);
}());