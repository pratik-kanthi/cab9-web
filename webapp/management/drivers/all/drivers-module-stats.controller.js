(function (angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriversModuleStatsController', driversModuleStatsController);

    driversModuleStatsController.$inject = ['$scope', '$UI', 'Model', '$config', '$http', 'rData'];
    function driversModuleStatsController($scope, $UI, Model, $config, $http, rData) {
        var recentAfter = new moment().subtract(2, 'weeks');
        

        Model.Driver
        .query()
        .select('Id,Active,CreationTime')
        .execute().then(function (data) {
            $scope.recentDrivers = data.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
            $scope.quickStats = {
                total: data.length,
                active: data.filter(function (d) { return d.Active }).length,
                recent: $scope.recentDrivers.length
            };
        });

        $scope.recentDrivers = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
        $scope.quickStats = {
            total: rData.length,
            active: rData.filter(function (d) { return d.Active }).length,
            recent: $scope.recentDrivers.length
        };
    }
}(angular));



