(function () {
    var module = angular.module('Stats', statsService);

    statsService.$inject = ['$http', '$config'];
    function statsService($http, $config) {
    }
    statsService.prototype.bookingStats = bookingStats;

    function bookingStats(params) {
        return $http({
            url: $config.API_ENDPOINT + '/stats',
            method: 'GET',
            params: params
        });
    }
}());