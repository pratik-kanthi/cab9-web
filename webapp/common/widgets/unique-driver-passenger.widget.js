(function() {
    var module = angular.module('cab9.widgets');

    module.directive('uniqueDriverPassenger', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/unique-driver-passenger.widget.html',
                scope: {
                    filters: '='
                },
                link: function(scope, element, attrs) {
                    scope.deferred = null;
                    var updateDebounce = null;
                    scope.refresh = recalculate;

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
                        $http({
                            url: $config.API_ENDPOINT + 'api/reports/booking',
                            method: 'GET',
                            params: {
                                from: scope.filters.from,
                                to: scope.filters.to,
                                groupbyentity: 'DriverId'
                            }
                        }).then(function(result) {
                            scope.uniqueDrivers = result.data.Grouped.length;
                            $http({
                                url: $config.API_ENDPOINT + 'api/reports/booking',
                                method: 'GET',
                                params: {
                                    from: scope.filters.from,
                                    to: scope.filters.to,
                                    groupbyentity: 'LeadPassengerId'
                                }
                            }).then(function(result) {
                                scope.uniquePassengers = result.data.Grouped.length;
                                scope.deferred.resolve(true);
                            }, function(error) {
                                scope.deferred.reject('An Error Occured');
                            });
                        }, function(error) {
                            scope.deferred.reject('An Error Occured');
                        });
                    }

                }
            };
        }
    ]);
}());
