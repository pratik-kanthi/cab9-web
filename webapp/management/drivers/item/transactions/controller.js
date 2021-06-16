(function (angular) {
    var module = angular.module('cab9.drivers');
    module.controller('DriverCreditCardsTransactionsController', DriverCreditCardsTransactionsController);

    DriverCreditCardsTransactionsController.$inject = ['$scope', '$state', '$http', '$config', 'Model', '$stateParams', '$q', 'rDriverId', '$modal', '$UI'];

    function DriverCreditCardsTransactionsController($scope, $state, $http, $config, Model, $stateParams, $q, rDriverId, $modal, $UI) {
        $scope.transactions = [];

        $scope.fetchTransactions = fetchTransactions;

        $scope.driverId = rDriverId;
        $scope.expandTransaction = expandTransaction;

        $scope.fetchTransactions();

        function fetchTransactions() {
            $scope.fetching = true;
            var transactionQuery = $config.API_ENDPOINT + "api/Transactions/driver-transactions?driverId=" + $scope.driverId;

            //fetch transactions
            $http({
                method: 'GET',
                url: transactionQuery
            }).then(function successCallback(response) {
                $scope.fetching = false;
                $scope.transactions = response.data;
            }, function errorCallback(response) {
                swal({
                    title: "Some Error Occured.",
                    text: response.data.ExceptionMessage,
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });

        }

        function expandTransaction(item) {
            item.$expanded = true;
            item.Request = JSON.parse(item.Request);
            item.Response = JSON.parse(item.Response);
        }
    }
})(angular)