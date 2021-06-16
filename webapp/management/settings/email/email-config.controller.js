(function (angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsEmailController', settingsEmailController);
    module.controller('SettingsEmailConfigController', settingsEmailConfigController);

    settingsEmailController.$inject = ['$scope', 'rTabs', 'rAccessors'];
    function settingsEmailController($scope, rTabs, rAccessors) {
        $scope.tabDefs = rTabs;
        $scope.accessors = rAccessors;
    }
	
    settingsEmailConfigController.$inject = ['$scope', 'rCompany', 'rConfig', 'Model'];
    function settingsEmailConfigController($scope, rCompany, rConfig, Model) {
        $scope.company = rCompany[0];
        $scope.config = rConfig[0];

        if (!$scope.config) {

        }

	    $scope.viewMode = 'VIEW';
	    $scope.startEdit = startEdit;
	    $scope.cancelEdit = cancelEdit;
	    $scope.saveEdits = saveEdits;
        $scope.addNew = addNew;
	    $scope.accessors = {
	        LogoUrl: function (item) { return $scope.company._ImageUrl; }
        }

	    function startEdit() {
	        $scope.viewMode = 'EDIT';
	    }

        function addNew() {
            $scope.config = new Model.EmailConfig();
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            if ($scope.config.Id) {
                $scope.config.$rollback(false);
            } else {
                $scope.config = null;
            }
	        $scope.viewMode = 'VIEW';
	    }

        function saveEdits() {
            if ($scope.config.Id) {
                $scope.config.$patch().success(function () {
                    $scope.viewMode = 'VIEW';
                });
            } else {
                $scope.config.$save().success(function () {
                    $scope.viewMode = 'VIEW';
                });
            }
	    }
	}
}(angular));