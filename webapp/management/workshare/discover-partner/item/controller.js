(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorksharePartnerController', WorksharePartnerController);

    WorksharePartnerController.$inject = ['$scope', '$state', 'rTabs', '$http', '$config', 'rCompanyProfile', 'Model'];

    function WorksharePartnerController($scope, $state, rTabs, $http, $config, rCompanyProfile, Model) {
        $scope.companyProfile = new Model.CompanyProfile(rCompanyProfile);
        $scope.companyProfile.Website = $scope.companyProfile.Website.indexOf('http:') == -1 ? 'http://' + $scope.companyProfile.Website : $scope.companyProfile.Website;
        $scope.showReject = false;
        $scope.fullAddress = fullAddress($scope.companyProfile);
        $scope.showRejectLoader = false;
        $scope.addPartner = addPartner;
        $scope.showRejectBox = showRejectBox;
        $scope.acceptRequest = acceptRequest;
        $scope.cancelReject = cancelReject;
        $scope.removeRequest = removeRequest;
        $scope.reject = {
            Reason: ""
        };
        $scope.fetchingProfile = true;
        $scope.myProfile = null;
        $http.get($config.API_ENDPOINT + 'api/partners/profile').success(function (result) {
            $scope.myProfile = result;
            $scope.fetchingProfile = false;
        }).error(function (err) {
            $scope.fetchingProfile = false;
        });
        $scope.tabDefs = rTabs;
        $scope.rejectRequest = rejectRequest;
        var tetherBox;
        $scope.driverVisibilityOptions = [{
            Value: "Select Driver Visibility",
            Description: "Select Driver Visibility"
        }, {
            Value: 'All',
            Description: "Allow partner to show all of online drivers to their clients"
        }, {
            Value: 'Available',
            Description: "Allow partner to show all your available drivers to their clients"
        }, {
            Value: 'Limited',
            Description: "Only show drivers who are on a shared booking"
        }]
        $scope.addPartnerObj = {
            PartnerDriverVisibilityConfig: $scope.driverVisibilityOptions[0],
            PartnerTenantId: $scope.companyProfile.TenantId
        }

        function cancelReject() {
            $scope.showReject = false;
            $('#reject-box').attr('style', 'display: none');
            if (tetherBox)
                tetherBox.destroy()
        }

        function removeRequest() {
            swal({
                title: "Are you sure?",
                text: "Request will be deleted.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                closeOnConfirm: true
            }, function () {
                $http.delete($config.API_ENDPOINT + 'api/partners/request?partnerRequestId=' + $scope.companyProfile.RequestId).success(function (result) {
                    swal({
                        title: "Deleted",
                        text: "Partner Request Deleted",
                        type: "success"
                    });
                    $state.reload();
                }).error(function (err) {
                    swal({
                        title: "Error",
                        text: err.ExceptionMessage,
                        type: "error"
                    });
                });
            });
        }

        function rejectRequest() {
            swal({
                title: "Are you sure?",
                text: "You will not be able to accept the request later.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Reject",
                closeOnConfirm: true
            }, function () {
                $scope.showRejectLoader = true;
                $http.put($config.API_ENDPOINT + 'api/partners/reject-request?partnerRequestId=' + $scope.companyProfile.PartnerRequestId + "&reasonForRejection=" + $scope.reject.Reason).success(function (result) {
                    swal({
                        title: "Partner Request Rejected",
                        text: "Partner request has been successfully rejected.",
                        type: "success"
                    });
                    $scope.showRejectLoader = false;
                    $scope.companyProfile.PartnerRequestStatus = 'Rejected';
                    $('#reject-box').attr('style', 'display: none');
                    if (tetherBox)
                        tetherBox.destroy()
                }).error(function (err) {
                    $scope.showRejectLoader = false;
                    swal({
                        title: "Error",
                        text: err.ExceptionMessage,
                        type: "error"
                    });
                });
            });
        }

        function acceptRequest() {
            $scope.showRejectLoader = true;
            $http.put($config.API_ENDPOINT + 'api/partners/accept-request?partnerRequestId=' + $scope.companyProfile.PartnerRequestId).success(function (result) {
                swal({
                    title: "Partner Request Accepted",
                    text: "Partner request has been successfully Accepted.",
                    type: "success"
                });
                $state.reload();
            }).error(function (err) {
                $scope.showRejectLoader = false;
                swal({
                    title: "Error",
                    text: err.ExceptionMessage,
                    type: "error"
                });
            });
        }

        function showRejectBox(request, index) {
            $scope.showReject = true;
            $scope.editposition = {
                attachment: 'top left',
                targetAttachment: 'top right',
                targetOffset: '0 10px'
            };
            $('#reject-box').attr('style', 'display: block');
            $scope.editposition.element = '#reject-box';
            $scope.editposition.target = '#reject-request-btn';
            tetherBox = new Tether($scope.editposition)
        }

        function addPartner() {
            swal({
                title: "Are you sure?",
                text: "A request will be sent to the partner to Accept/Reject.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Send",
                closeOnConfirm: true
            }, function () {
                $http.post($config.API_ENDPOINT + 'api/partners/request', {
                        PartnerDriverVisibilityConfig: $scope.addPartnerObj.PartnerDriverVisibilityConfig.Value,
                        PartnerTenantId: $scope.companyProfile.TenantId
                    })
                    .success(function (result) {
                        swal({
                            title: "Partnership Requests Sent",
                            text: "Partner has been notified.",
                            type: "success"
                        });
                        $state.reload();
                    }).error(function (err) {
                        swal({
                            title: "Error",
                            text: err.ExceptionMessage,
                            type: "error"
                        });
                    });
            });
        }

        function fullAddress(company) {
            var summary = '';
            summary += company.Address1 ? (company.Address1 + '\n') : '';
            summary += company.Address2 ? (company.Address2 + '\n') : '';
            summary += company.Area ? (company.Area + '\n') : '';
            summary += company.TownCity ? (company.TownCity + '\n') : '';
            summary += company.Postcode ? (company.Postcode + '\n') : '';
            summary += company.County ? (company.County + '\n') : '';
            summary += company.Country ? company.Country : '';
            return summary;
        }
    }
}(angular));