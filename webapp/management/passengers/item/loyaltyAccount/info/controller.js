(function (angular) {
    var module = angular.module('cab9.passengers');

    module.controller('LoyaltyAccountInfoController', loyaltyAccountInfoController);

    loyaltyAccountInfoController.$inject = ['$scope','rLoyaltyInfo', 'rTabs', 'Model','$http', '$stateParams'];

    function loyaltyAccountInfoController($scope, rLoyaltyInfo, rTabs, Model, $http, $stateParams) {
        $scope.loyaltyInfo = new Model.LoyaltyAccount(rLoyaltyInfo.data.account);
        $scope.conversion = rLoyaltyInfo.data.conversion;
        $scope.viewMode = 'VIEW';

        $scope.transactions = [];
        $scope.startEdit = startEdit;
	    $scope.cancelEdit = cancelEdit;
	    $scope.saveEdits = saveEdits;
        $scope.addNew = addNew;

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
            $http.put('http://localhost:8081/v1.1/api/passenger/loyalty-account?passengerId=' + $stateParams.Id, { 
                Active: $scope.loyaltyInfo.Active
            }).success(function(data) {
                swal("Updated!", "Configuration has been updated.", "success");
                $scope.viewMode = 'VIEW';
            });
	    }
    }
}(angular))