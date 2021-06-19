(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareCompanyController', workshareCompanyController);

    workshareCompanyController.$inject = ['$scope', '$state', 'rTabs', 'rCompanyProfile', '$UI', 'Model', 'Auth'];

    function workshareCompanyController($scope, $state, rTabs, rCompanyProfile, $UI, Model, Auth) {
        $scope.companyProfile = rCompanyProfile;
        $scope.tabDefs = rTabs;
        $scope.startCreate = startCreate;
        $scope.cancelCreate = cancelCreate;
        $scope.saveProfile = saveProfile;
        $scope.newProfile = null;
        $scope.loading = false;
        $scope.pricingModels = [];
        Model.PricingModel
            .query()
            .filter("TenantId eq guid'" + Auth.getSession().TenantId + "'")
            .trackingEnabled()
            .execute().then(function (result) {
                $scope.pricingModels = result;
            }, function (err) {
                swal({
                    title: "Error Fetching Pricing Models",
                    text: "Some error has occurred.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            });
        $scope.$watch('newProfile.PricingModelId', function () {
            $scope.pricingModel = $scope.pricingModels.find(function (item) {
                return item.Id == $scope.newProfile.PricingModelId
            })
        })

        function cancelCreate() {
            $scope.newProfile = null;
        }

        function startCreate() {
            $scope.newProfile = new Model.CompanyProfile();
        }

        function saveProfile() {
            $scope.loading = true;
            $scope.newProfile.$save().then(function (response) {
                swal({
                    title: "Company Profile Saved",
                    text: "Profile save successfully",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go('root.workshare.company.profile', null, {
                    reload: true
                })
            }, function (err) {
                $scope.loading = false;
                swal({
                    title: "Some Error Occurred.",
                    text: "Some error has occurred.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }
    }
}(angular));