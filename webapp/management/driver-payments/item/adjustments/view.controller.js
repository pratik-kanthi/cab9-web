(function () {
    var module = angular.module('cab9.driverpayments');

    module.controller('DriverPaymentsViewAdjustmentsController', driverPaymentsViewAdjustmentsController);

    driverPaymentsViewAdjustmentsController.$inject = ['$scope', '$modal', 'rAdjustments', 'Model', '$http', '$config', '$state', '$q', '$UI'];

    function driverPaymentsViewAdjustmentsController($scope, $modal, rAdjustments, Model, $http, $config, $state, $q, $UI) {
        $scope.adjustments = rAdjustments;
        $scope.displayMode = "VIEW";
    }
})();