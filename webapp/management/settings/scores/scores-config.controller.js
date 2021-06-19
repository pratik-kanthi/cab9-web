(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsScoresController', SettingsScoresController);
	
    SettingsScoresController.$inject = ['$scope', 'rSettings', 'Model'];
    function SettingsScoresController($scope, rSettings, Model) {
        if (rSettings[0] != null) {
            $scope.settings = rSettings[0];
        } else {
            $scope.settings = new Model.ScoreWeighting();
        }
	    $scope.viewMode = 'VIEW';
	    $scope.startEdit = startEdit;
	    $scope.cancelEdit = cancelEdit;
	    $scope.saveEdits = saveEdits;
	    $scope.sum = sum;

	    function startEdit() {
	        $scope.viewMode = 'EDIT';
	    }

	    function cancelEdit() {
	        $scope.settings.$rollback(false);
	        $scope.viewMode = 'VIEW';
	    }

	    function saveEdits() {
	        if ($scope.settings.Id) {
	            $scope.settings.$patch().success(function () {
	                $scope.viewMode = 'VIEW';
	            });
	        } else {
	            $scope.settings.$save().success(function () {
	                $scope.viewMode = 'VIEW';
	            });
	        }
	    }

	    function sum() {
	        var value = 0;
	        for (var i = 0; i < arguments.length; i++) {
                if (arguments[i])
	                value += Number(arguments[i]);
	        }
	        return value;
	    }
	}
}(angular));