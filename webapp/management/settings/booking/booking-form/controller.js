(function (angular) {
    var module = angular.module('cab9.settings');

    
    module.controller('SettingsBookingFormController', SettingsBookingFormController);

    SettingsBookingFormController.$inject = ['$scope', 'rCompany'];
    function SettingsBookingFormController($scope, rCompany) {
        $scope.company = rCompany[0];
        
        $scope.viewMode = 'VIEW';

        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.company.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $scope.company.$patch().success(function () {
                $scope.viewMode = 'VIEW';
            });
        }
    }
}(angular));