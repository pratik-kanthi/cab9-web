

(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('LoyaltyConfigController', loyaltyConfigController);

    loyaltyConfigController.$inject = ['$scope', '$http','Model'];
    function loyaltyConfigController($scope, $http, Model) {
        $scope.loading = true;
        $scope.config = null;
        $scope.startEdit = startEdit;
	    $scope.cancelEdit = cancelEdit;
	    $scope.saveEdits = saveEdits;
        $scope.addNew = addNew;
        $scope.viewMode = 'VIEW';

        $http.get('http://localhost:8081/v1.1/api/client/configuration').success(function(data) {
            var response = data.Configuration;
            response.TenantId = data.TenantId;
            $scope.config = new Model.LoyaltyConfig(response);
            $scope.loading = false;
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
            $http.put('https://cab9-loyalty.herokuapp.com/v1.1/api/client/configuration', $scope.config).success(function(data) {
                swal("Updated!", "Configuration has been updated.", "success");
                $scope.viewMode = 'VIEW';
            });
	    }
    }
}(angular));