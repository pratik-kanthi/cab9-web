(function() {
    var module = angular.module('cab9.widgets');

    module.directive('staffReport', ['$rootScope', '$state', '$UI', '$config', '$http', '$q', '$filter', '$timeout',

        function($rootScope, $state, $UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/staff-report.tmpl.html',
                scope: {
                    filters: '=',
                    client: '=',
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;
                    // scope.download = download;
                    // scope.helpText = reports.help.user_stats;
                    scope.staff = [];

                    openStaff = function(item) {
                        if ($rootScope.CLIENTID) {
                            $state.go('root.bookers.viewer.details', { 'sId': item.ClientStaffId })
                        } else {
                            $state.go('root.clients.viewer.staff.viewer.details', { 'Id': scope.client, 'sId': item.ClientStaffId })
                        }
                    }
                    scope.openStaff = openStaff;

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
                        scope.staff.length = 0;
                        scope.bestStaff = null;
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                ClientIds: "'" + scope.client + "'",
                                groupbyentity: 'ClientStaffId',
                            }
                        }).then(function(result) {
                            scope.staff = result.data.Grouped;
                            scope.bestStaff = result.data.Grouped[0];

                            for (var i = 0; i < scope.staff.length; i++) {
                                if (scope.staff[i].ImageUrl && scope.staff[i].ImageUrl[0] === 'h') {
                                    continue;
                                }
                                scope.staff[i].ImageUrl = formatImage(scope.staff[i].ImageUrl, scope.staff[i].Name);
                            }
                            scope.deferred.resolve(true);
                            if (scope.bestStaff) {
                                $http({
                                    url: $config.API_ENDPOINT + '/api/reports/booking',
                                    method: 'GET',
                                    params: {
                                        from: scope.filters.from,
                                        to: scope.filters.to,
                                        ClientStaffIds: "'" + scope.bestStaff.ClientStaffId + "'",
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
                                    $('#staff-sparkline').sparkline(myvalues, sparklineOptions);
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