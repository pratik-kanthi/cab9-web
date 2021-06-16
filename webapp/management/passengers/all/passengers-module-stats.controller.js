(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengersModuleStatsController', passengersModuleStatsController);

    passengersModuleStatsController.$inject = ['$scope', '$UI', 'Model', '$config', '$http', 'rStatsData'];
    function passengersModuleStatsController($scope, $UI, Model, $config, $http, rStatsData) {

        //var recentAfter = new moment().subtract(2, 'weeks');
        // Model.Passenger
        //     .query()
        //     .select('Id,Active,CreationTime')
        //     .execute().then(function (data) {
        //         $scope.recentPassengers = data.filter(function (d) { return new moment(d.CreationTime).isAfter(recentAfter); });
        //         $scope.quickStats = {
        //             total: data.length,
        //             active: data.filter(function (d) { return d.Active }).length,
        //             recent: $scope.recentPassengers.length
        //         };
        //     });
        //$scope.recentPassengers = rStatsData.MostRecent;
        //$scope.quickStats = {
        //    total: rStatsData.Total,
        //    active: rStatsData.Active,
        //    recent: rStatsData.Recent
        //};
    }
}(angular))