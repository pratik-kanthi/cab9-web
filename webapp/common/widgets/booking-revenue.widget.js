(function() {
    var module = angular.module('cab9.widgets');

    module.directive('bookingRevenue', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/booking-revenue.tmpl.html',
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
                                to: scope.filters.to
                            }
                        }).then(function(result) {
                            scope.totalBookings = result.data.Totals.TotalBookings;
                            scope.totalAmount = result.data.Totals.TotalActualCost;
                            scope.deferred.resolve(true);
                        }, function(error) {
                            scope.deferred.reject('An Error Occured');
                        });
                    }

                }
            };
        }
    ]);
}());
