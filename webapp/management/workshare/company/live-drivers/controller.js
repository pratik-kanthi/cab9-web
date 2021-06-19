(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareLiveDriversController', WorkshareLiveDriversController);

    WorkshareLiveDriversController.$inject = ['$scope', '$state', '$http', '$config', 'rCompany', 'rCompanyProfile'];

    function WorkshareLiveDriversController($scope, $state, $http, $config, rCompany, rCompanyProfile) {
        $scope.company = rCompany[0];
        $scope.companyProfile = rCompanyProfile;
        $scope.toggleLiveDrivers = toggleLiveDrivers;

        function toggleLiveDrivers(cancelRequest) {
            var text = cancelRequest ? 'Request will be Cancelled.' : ("Live driver feature will be " + ($scope.companyProfile.ShowLiveDrivers ? 'enabled' : 'disbaled') + " in 12 hours");
            var confirmText = cancelRequest ? 'Request Cancelled.' : ("Live driver feature " + ($scope.companyProfile.ShowLiveDrivers ? 'enabled' : 'disbaled'));
            swal({
                title: "Are you sure?",
                text: text,
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Confirm",
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm) {
                if (!isConfirm) {
                    $scope.companyProfile.ShowLiveDrivers = !$scope.companyProfile.ShowLiveDrivers;
                    $scope.$apply()
                    swal.close();
                } else {
                    $http.put($config.API_ENDPOINT + 'api/partners/profile/toggle-live-drivers?cancelRequest=' + cancelRequest)
                        .success(function (data) {
                            $state.reload();
                            swal({
                                title: "Success",
                                text: confirmText,
                                type: "success"
                            });
                            $scope.viewMode = 'VIEW';
                        })
                        .error(function (res) {
                            swal("Error", res.ExceptionMessage, "error");
                        });
                }
            })
        }
    }
}(angular));