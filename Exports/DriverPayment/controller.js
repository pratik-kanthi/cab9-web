(function(window, angular) {
    var app = angular.module("cab9.export");

    app.controller('DriverPaymentController', driverPaymentController);

    driverPaymentController.$inject = ['$scope', '$http', '$location', '$config'];

    function driverPaymentController($scope, $http, $location, $config) {
        $scope.paymentId = $location.search().paymentId;
        $scope.API_ENDPOINT = $config.API_ENDPOINT;        

        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + "api/driverpayments/paymentdetails",
            headers: {
                //Authorization: "Bearer " + $scope.token
            },
            params: {
                paymentId: $scope.paymentId
            }
        }).success(function(data) {
            $scope.dp = data;
            //set localisation values
        });
    }

})(window, angular);
