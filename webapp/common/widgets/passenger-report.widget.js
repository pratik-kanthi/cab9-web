(function() {
    var module = angular.module('cab9.widgets');

    module.directive('passengerReport', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/passenger-report.tmpl.html',
                scope: {
                    filters: '=',
                    client: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    scope.passengers = [];
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
                        scope.passengers.length = 0;
                        scope.bestPassenger = null;
                        var params = {
                            from: scope.filters.from,
                            to: scope.filters.to,
                            groupbyentity: 'LeadPassengerId'
                        };
                        if (scope.client)
                            params.ClientIds = "'" + scope.client + "'";
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: params

                        }).then(function(result) {
                            scope.passengers = result.data.Grouped;
                            scope.bestPassenger = result.data.Grouped[0];

                            for (var i = 0; i < scope.passengers.length; i++) {
                                if (scope.passengers[i].ImageUrl && scope.passengers[i].ImageUrl[0] === 'h') {
                                    continue;
                                }
                                scope.passengers[i].ImageUrl = formatImage(scope.passengers[i].ImageUrl, scope.passengers[i].Name);
                            }
                            scope.deferred.resolve(true);
                            if (scope.bestPassenger) {
                                $http({
                                    url: $config.API_ENDPOINT + '/api/reports/booking',
                                    method: 'GET',
                                    params: {
                                        from: scope.filters.from,
                                        to: scope.filters.to,
                                        PassengerIds: "'" + scope.bestPassenger.LeadPassengerId + "'",
                                        periodlength: 'dd'
                                    }
                                }).then(function(result) {
                                    scope.myvalues = [];
                                    angular.forEach(result.data.Grouped, function(p) {
                                        scope.myvalues.push(p.Bookings);
                                    })
                                    var sparklineOptions = {
                                        type: 'line',
                                        lineColor: '#D06609',
                                        fillColor: '#D06609',
                                        width: '100%',
                                        height: '64px'
                                    };
                                    $('#passenger-sparkline').sparkline(scope.myvalues, sparklineOptions);

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