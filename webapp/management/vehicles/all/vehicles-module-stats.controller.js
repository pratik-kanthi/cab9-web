(function (angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehiclesModuleStatsController', vehiclesModuleStatsController);

    vehiclesModuleStatsController.$inject = ['$scope', '$UI', 'Model', '$config', '$http', 'rData'];
    function vehiclesModuleStatsController($scope, $UI, Model, $config, $http, rData) {

        var recentAfter = new moment().subtract(2, 'weeks');
        $scope.recentVehicles = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
        $scope.quickStats = {
            total: rData.length,
            active: rData.filter(function (d) { return d.Active }).length,
            recent: $scope.recentVehicles.length
        };
    }
}(angular))