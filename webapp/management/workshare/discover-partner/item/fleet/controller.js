(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerFleetController', WorksharePartnerFleetController);

    WorksharePartnerFleetController.$inject = ['$scope', '$config', '$http', 'rCompanyProfile'];

    function WorksharePartnerFleetController($scope, $config, $http, rCompanyProfile) {
        $scope.companyProfile = rCompanyProfile;

        $scope.getFleetDetails = getFleetDetails;

        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null,
            loading: true,
        };

        getFleetDetails(1);

        function getFleetDetails(pageNum) {
            $scope.paging.currentPage = pageNum || 1;

            $http.get($config.API_ENDPOINT + 'api/partners/{tenantId}/fleet', {
                params: {
                    tenantId: $scope.companyProfile.TenantId,
                    pageNumber: pageNum || 1,
                    records: $scope.paging.resultsPerPage
                }
            }).success(function (response) {
                $scope.paging.totalResults = response.Count;
                $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                $scope.fleetDetails = response.FleetDetails;
            }).error(function (error) {
                swal("Error", error.data.ExceptionMessage, "error");
            });

        }
    }
}(angular));