(function(angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsMaskedNumberController', settingsMaskedNumberController);

    settingsMaskedNumberController.$inject = ['$scope', 'rMaskedNumberProviderDetail', 'rCompany', 'Model', '$http'];

    function settingsMaskedNumberController($scope, rMaskedNumberProviderDetail, rCompany, Model, $http) {
        $scope.company = rCompany[0];

        if (rMaskedNumberProviderDetail != undefined && rMaskedNumberProviderDetail.length > 0) {
            $scope.maskedNumberProviderDetail = rMaskedNumberProviderDetail[0];
            $scope.existing = true;
        } else {
            $scope.maskedNumberProviderDetail = new Model.MaskedNumberProviderDetail();
            $scope.existing = false;
        }

        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.delete = deleteMasked;

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.maskedNumberProviderDetail.$rollback(false);
            $scope.viewMode = 'VIEW';
        }

        function deleteMasked() {
            swal({
                title: "Are you sure?",
                text: "Masked number functionality will be removed for your account. ",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm",
                closeOnConfirm: false
            }, function() {
                $scope.maskedNumberProviderDetail.$delete().success(function() {
                    swal("Masked Number Deleted", "Masked number functionality has been removed for your account", "success");
                    $scope.maskedNumberProviderDetail = new Model.MaskedNumberProviderDetail();
                    $scope.existing = false;
                });
            });
        }

        function saveEdits() {
            if ($scope.existing) {
                $scope.maskedNumberProviderDetail.$update().success(function() {
                    $scope.viewMode = 'VIEW';
                    swal("Masked Number Details Updated", "Masked number details have been updated.", "success");
                });
            } else {
                $http.post($config.API_ENDPOINT + 'api/MaskedNumberProviderDetails', $scope.maskedNumberProviderDetail).success(function(res) {
                	swal("Masked Number Details Added", "Masked number details have been added for your account.", "success");
                    $scope.viewMode = 'VIEW';
                    $scope.existing = true;
                }).error(function() {
                    alert('Some Error Occurred.');
                });
            }
        }
    }
}(angular));