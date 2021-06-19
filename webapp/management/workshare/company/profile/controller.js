(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareCompanyProfileController', WorkshareCompanyProfileController);

    WorkshareCompanyProfileController.$inject = ['$scope', 'Model', '$http', '$UI', '$config', 'rCompany', 'rCompanyProfile', 'Auth'];

    function WorkshareCompanyProfileController($scope, Model, $http, $UI, $config, rCompany, rCompanyProfile, Auth) {
        $scope.company = rCompany[0];
        $scope.companyProfile = rCompanyProfile;
        if (!$scope.companyProfile) {
            $state.go('root.workshare.company')
        }
        Model.PricingModel
            .query()
            .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
            .select("Id, Name")
            .trackingEnabled()
            .execute().then(function (result) {
                $scope.pricingModels = result;
                $scope.pricingModel = $scope.pricingModels.find(function (x) {
                    return x.Id == $scope.companyProfile.PricingModelId;
                });
            }, function (err) {
                swal({
                    title: "Error Fetching Pricing Models",
                    text: "Some error has occurred.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });

        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;


        function startEdit() {
            if (!$scope.companyProfile) {
                $scope.companyProfile = new Model.CompanyProfile();
            }
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            if ($scope.companyProfile.Id) {
                $scope.companyProfile.$rollback(false);
            } else {
                $scope.companyProfile = null;
            }
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $http.put($config.API_ENDPOINT + 'api/partners/profile?profileId=' + $scope.companyProfile.Id, $scope.companyProfile)
                .success(function (data) {
                    swal({
                        title: "Profile updated",
                        text: "Company Profile has been updated",
                        type: "success"
                    });
                    $scope.viewMode = 'VIEW';
                })
                .error(function (res) {
                    swal("Error", res.ExceptionMessage, "error");
                });
        }

        $scope.$watch("companyProfile.PricingModelId", function (newValue) {
            $scope.pricingModel = null;
            if (newValue && $scope.pricingModels) {
                $scope.pricingModel = $scope.pricingModels.find(function (x) {
                    return x.Id == newValue;
                });
            }
        })
    }
}(angular));