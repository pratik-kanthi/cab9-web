(function (angular) {
    var module = angular.module('cab9.client.passengers');

    module.controller('PassengersModuleStatsController', passengersModuleStatsController);

    passengersModuleStatsController.$inject = ['$scope', '$UI', 'Model', '$config', '$http', 'rData'];
    function passengersModuleStatsController($scope, $UI, Model, $config, $http, rData) {
        var recentAfter = new moment().subtract(2, 'weeks');
        $scope.recentPassengers = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
        $scope.quickStats = {
            total: rData.length,
            active: rData.filter(function (d) { return d.Active }).length,
            recent: $scope.recentPassengers.length
        };
    }
}(angular))