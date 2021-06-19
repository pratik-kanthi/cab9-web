(function (angular) {
    var module = angular.module('cab9.workshare');
    module.controller('WorkshareRequestsController', workshareRequestsController);

    workshareRequestsController.$inject = ['$scope', '$http', '$config', '$UI'];

    function workshareRequestsController($scope, $http, $config, $UI) {
        fetchRequests('Received')
        $scope.fetchRequests = fetchRequests;
        $scope.removeRequest = removeRequest;
        $scope.acceptRequest = acceptRequest;
        $scope.rejectRequest = rejectRequest;
        $scope.showRejectBox = showRejectBox;
        $scope.addPartner = addPartner;
        $scope.cancelReject = cancelReject;
        $scope.rejectReason = "";
        $scope.selectedRequest = null;
        var tetherBox = null;
        var selectedRequestIndex = null;

        function cancelReject() {
            $scope.selectedRequest = null;
            $('#reject-box').attr('style', 'display: none');
            if (tetherBox)
                tetherBox.destroy()
        }

        function fetchRequests(type) {
            $scope.fetching = true;
            $scope.apiRequest = $scope.apiRequest || {};
            $scope.apiRequest.Type = type;
            $http.get($config.API_ENDPOINT + "api/partners/requests?type=" + type.toLowerCase())
                .then(function (result) {
                    $scope.fetching = false;
                    $scope.requests = result.data;
                }, function (err) {
                    $scope.fetching = false;
                    swal({
                        title: "Some Error Occurred.",
                        text: "Some error has occurred.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
        }

        function removeRequest(request) {
            swal({
                title: "Are you sure?",
                text: "Request will be deleted.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Delete",
                closeOnConfirm: true
            }, function () {
                $http.delete($config.API_ENDPOINT + 'api/partners/request?partnerRequestId=' + request.Id).success(function (result) {
                    swal({
                        title: "Deleted",
                        text: "Partner Request Deleted",
                        type: "success"
                    });
                    fetchRequests('Sent')
                }).error(function (err) {
                    swal({
                        title: "Error",
                        text: err.ExceptionMessage,
                        type: "error"
                    });
                });
            });
        }

        function acceptRequest(request, index) {
            swal({
                title: "Are you sure?",
                text: "You will be be able to send/receive bookings to/from the company.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Send",
                closeOnConfirm: true
            }, function () {
                $scope.loading=true;
                $http.put($config.API_ENDPOINT + 'api/partners/accept-request?partnerRequestId=' + request.Id).success(function (result) {
                    swal({
                        title: "Partner Added",
                        text: "Partner has been successfully added.",
                        type: "success"
                    });
                    $scope.loading=false;
                    fetchRequests('Received')
                }).error(function (err) {
                    $scope.loading=false;
                    swal({
                        title: "Error",
                        text: err.ExceptionMessage,
                        type: "error"
                    });
                });
            });
        }

        function addPartner(request) {
            swal({
                title: "Are you sure?",
                text: "A request will be sent to the partner to Accept/Reject.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Send",
                closeOnConfirm: true
            }, function () {
                $http.post($config.API_ENDPOINT + 'api/partners/request', {
                        PartnerDriverVisibilityConfig: null,
                        PartnerTenantId: request.PartnerTenantId
                    })
                    .success(function (result) {
                        swal({
                            title: "Successful",
                            text: "Partnership request sent.",
                            type: "success"
                        });
                        fetchRequests('Received')
                    }).error(function (err) {
                        swal({
                            title: "Error",
                            text: err.ExceptionMessage,
                            type: "error"
                        });
                    });
            });
        }

        function showRejectBox(request, index) {
            $scope.selectedRequest = request;
            selectedRequestIndex = index;
            $scope.editposition = {
                attachment: 'top left',
                targetAttachment: 'top left',
                targetOffset: '30px 0'
            };
            $('#reject-box').attr('style', 'display: block');
            $scope.editposition.element = '#reject-box';
            $scope.editposition.target = '#accept-' + request.Id
            tetherBox = new Tether($scope.editposition)
        }
        $scope.$on('$destroy', function () {
            $('#reject-box').remove()
        });

        function rejectRequest(index) {
            swal({
                title: "Are you sure?",
                text: "You will not be able to accept the request later.",
                type: "warning",
                showCancelButton: true,
                confirmButtonText: "Reject",
                closeOnConfirm: true
            }, function () {
                $scope.loading=true;
                $http.put($config.API_ENDPOINT + 'api/partners/reject-request?partnerRequestId=' + $scope.selectedRequest.Id + "&reasonForRejection=" + $scope.rejectReason).success(function (result) {
                    swal({
                        title: "Partner Request Rejected",
                        text: "Partner request has been successfully rejected.",
                        type: "success"
                    });
                    $scope.loading = false;
                    $scope.selectedRequest = null;
                    $('#reject-box').attr('style', 'display: none');
                    if (tetherBox)
                        tetherBox.destroy()
                    $scope.requests.splice(selectedRequestIndex, 1);
                }).error(function (err) {
                    $scope.loading = false;
                    swal({
                        title: "Error",
                        text: err.ExceptionMessage,
                        type: "error"
                    });
                });
            });
        }
    }
}(angular));