(function(angular) {
    var module = angular.module('cab9.common');
    module.controller('CreditCardsTransactionsController', creditCardsTransactionsController);

    creditCardsTransactionsController.$inject = ['$scope', '$state', '$http', '$config', 'Model', '$stateParams', '$q', 'rClientId', 'rPassengerId', '$modal'];

    function creditCardsTransactionsController($scope, $state, $http, $config, Model, $stateParams, $q, rClientId, rPassengerId, $modal) {

        $scope.transactions = [];

        $scope.fetchTransactions = fetchTransactions;

        $scope.clientId = rClientId;
        $scope.passengerId = rPassengerId;
        $scope.expandTransaction = expandTransaction;

        $scope.fetchTransactions();

        function fetchTransactions() {
            $scope.fetching = true;
            var transactionQuery = $config.API_ENDPOINT + "api/Transactions/DetailedTransactions";
            if($scope.clientId && !$scope.passengerId) {
                transactionQuery += "?clientId=" + $scope.clientId;
            } else if(!$scope.clientId && $scope.passengerId) {
                transactionQuery += "?passengerId=" + $scope.passengerId;
            } else if (!$scope.clientId && !$scope.passengerId) {

            } else {
                swal("Conflict in Query", "Transactions are being requested for both a client and passenger which is not possible.", "error");
            }

            //fetch transactions
            $http({
                method: 'GET',
                url: transactionQuery
            }).then(function successCallback(response) {
                $scope.transactions = response.data;
            }, function errorCallback(response) {
                console.log(response);
            });

        }

        function expandTransaction(item) {
            item.$expanded = true;
            item.Request = JSON.parse(item.Request);
            item.Response = JSON.parse(item.Response);
        }
    }
})(angular)
