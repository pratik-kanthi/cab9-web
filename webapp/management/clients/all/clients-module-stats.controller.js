(function (angular) {
    var module = angular.module('cab9.clients');

    module.controller('ClientsModuleStatsController', clientsModuleStatsController);

    clientsModuleStatsController.$inject = ['$scope', '$UI', 'Model', '$config', '$http', 'rData'];
    function clientsModuleStatsController($scope, $UI, Model, $config, $http, rData) {

        $scope.ApiEndPoint = $config.API_ENDPOINT;
        var recentAfter = new moment().subtract(2, 'weeks');

        Model.Client
            .query()
            .select('Id,Active,CreationTime')
            .execute().then(function (data) {
                $scope.recentClients = data.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });

                $scope.quickStats = {
                    total: data.length,
                    active: data.filter(function (d) { return d.Active }).length,
                    recent: $scope.recentClients.length
                };
            });

        $scope.recentClients = rData.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });

        $scope.quickStats = {
            total: rData.length,
            active: rData.filter(function (d) { return d.Active }).length,
            recent: $scope.recentClients.length
        };
    }
}(angular))