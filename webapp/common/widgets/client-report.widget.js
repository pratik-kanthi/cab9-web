(function() {
    var module = angular.module('cab9.widgets');

    module.directive('clientReport', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/client-report.tmpl.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    // scope.download = download;
                    // scope.helpText = reports.help.user_stats;
                    scope.clients = [];

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
                        scope.clients.length = 0;
                        scope.bestClient = null;
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                groupbyentity: 'ClientId',
                            }
                        }).then(function(result) {
                            scope.clients = result.data.Grouped;
                            scope.bestClient = result.data.Grouped[0];

                            for (var i = 0; i < scope.clients.length; i++) {
                                if (scope.clients[i].ImageUrl && scope.clients[i].ImageUrl[0] === 'h') {
                                    continue;
                                }
                                scope.clients[i].ImageUrl = window.formatImage(scope.clients[i].ImageUrl, scope.clients[i].Name);
                            }
                            scope.deferred.resolve(true);
                            if (scope.bestClient) {
                                $http({
                                    url: $config.API_ENDPOINT + '/api/reports/booking',
                                    method: 'GET',
                                    params: {
                                        from: scope.filters.from,
                                        to: scope.filters.to,
                                        ClientIds: "'" + scope.bestClient.ClientId + "'",
                                        periodlength: 'dd'
                                    }
                                }).then(function(result) {
                                    var myvalues = [];
                                    angular.forEach(result.data.Grouped, function(p) {
                                        myvalues.push(p.Bookings);
                                    })
                                    var sparklineOptions = {
                                        type: 'line',
                                        lineColor: '#8755DE',
                                        fillColor: '#8755DE',
                                        width: '100%',
                                        height: '64px'
                                    };
                                    $('#client-sparkline').sparkline(myvalues, sparklineOptions);


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