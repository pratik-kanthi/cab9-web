(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('LoyaltyAccountTransactionsController', loyaltyAccountTransactionsController);

    loyaltyAccountTransactionsController.$inject = ['$scope','$stateParams', 'rTransactions','Model'];

    function loyaltyAccountTransactionsController($scope, $stateParams, rTransactions, Model) {
        $scope.transactions = [];
        $scope.transactions = rTransactions.data.map(function(transaction){
            transaction.Id = transaction._id;
            return transaction
        });
    }
}(angular))