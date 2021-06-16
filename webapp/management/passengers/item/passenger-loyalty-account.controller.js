(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('PassengerLoyaltyAccountController', passengerLoyaltyAccountController);

    passengerLoyaltyAccountController.$inject = ['$scope','rLoyaltyInfo', 'Model','$http', '$stateParams'];

    function passengerLoyaltyAccountController($scope,rLoyaltyInfo, Model, $http, $stateParams) {
        $scope.loyaltyInfo = new Model.LoyaltyAccount(rLoyaltyInfo.data.account);
        $scope.conversion = rLoyaltyInfo.data.conversion;

        $scope.viewMode = 'VIEW';

        $scope.transactions = [];
        $scope.startEdit = startEdit;
	    $scope.cancelEdit = cancelEdit;
	    $scope.saveEdits = saveEdits;
        $scope.addNew = addNew;

        $http.get('http://localhost:8081/v1.1/api/passenger/loyalty-transactions?passengerId=' + $stateParams.Id).success(function(data){
            $scope.transactions = data;
        });


        function startEdit() {
	        $scope.viewMode = 'EDIT';
	    }

        function addNew() {
            $scope.config = new Model.LoyaltyConfig();
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
	        $scope.viewMode = 'VIEW';
	    }

        function saveEdits() {
            $scope.viewMode = 'VIEW';
	    }
    }
}(angular))