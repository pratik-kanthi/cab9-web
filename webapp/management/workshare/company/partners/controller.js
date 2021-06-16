(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareCompanyPartnersController', workshareCompanyPartnersController);

    workshareCompanyPartnersController.$inject = ['$scope', '$http', '$config'];

    function workshareCompanyPartnersController($scope, $http, $config) {
        var rPartners = [];
        $scope.fetching = true;
        $http({
            method: 'GET',
            url: $config.API_ENDPOINT + 'api/partners/linked',
        }).then(function successCallback(response) {
            $scope.fetching = false;
            rPartners = response.data;
            $scope.registeredPartners = angular.copy(rPartners);
        }, function errorCallback(error) {
            $scope.fetching = false;
            swal("Get Linked Partners", error.data.ExceptionMessage, "error");
        });
        $scope.changePartnerStatus = changePartnerStatus;

        function changePartnerStatus(partner, index) {
            swal({
                title: "Are you sure?",
                text: "Partnership will be removed. You will not be able to send/receive bookings to/from the company.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: partner.Active ? "Activate" : "Deactivate",
                closeOnConfirm: false,
                closeOnCancel: false
            }, function (isConfirm) {
                if (!isConfirm) {
                    partner.Active = !partner.Active;
                    $scope.$apply();
                    swal.close()
                    return;
                }
                if (partner.Active) {
                    $http.put($config.API_ENDPOINT + 'api/partners/activate?partnerTenantId=' + partner.TenantId)
                        .success(function (data) {
                            swal({
                                title: "Partner updated",
                                text: " Workshare partnership activated",
                                type: "success"
                            });
                        })
                        .error(function (res) {
                            swal("Error", res.ExceptionMessage, "error");
                        });
                } else {
                    $http.put($config.API_ENDPOINT + 'api/partners/deactivate?partnerTenantId=' + partner.TenantId)
                        .success(function (data) {
                            swal({
                                title: "Partner updated",
                                text: " Workshare partnership de-activated",
                                type: "success"
                            });
                        })
                        .error(function (res) {
                            swal("Error", res.ExceptionMessage, "error");
                        });
                }
            }, function (dismiss) {
                $scope.registeredPartners[index].Active = angular.copy(rPartners)[index].Active
            })
        }

    }
}(angular));