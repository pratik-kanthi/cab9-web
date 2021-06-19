(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientStaffItemUserController', clientStaffItemUserController);

    clientStaffItemUserController.$inject = ['$scope', '$stateParams', '$rootScope', '$state', '$q', '$config', '$UI', '$http', '$modal', 'Model', 'rUser', 'rData'];

    function clientStaffItemUserController($scope, $stateParams, $rootScope, $state, $q, $config, $UI, $http, $modal, Model, rUser, rData) {
        if (rUser.Message == "User Not Found")
            $scope.User = null;
        else
            $scope.User = angular.copy(rUser);
        $scope.staff = rData[0];
        $scope.displayMode = "VIEW";
        $scope.openUserModal = openUserModal;
        $scope.deleteUserAccount = deleteUserAccount;
        $scope.resetPassword = resetPassword;
        $scope.openLinkUserModal = openLinkUserModal;

        function resetPassword() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/common/modals/user/modal.html',
                controller: 'UserModalController',
                resolve: {
                    rUser: function () {
                        return {
                            Id: $scope.User.Id,
                            UserName: $scope.User.UserName,
                            Email: $scope.User.Email
                        }
                    },
                    rClaim: function () {
                        return {
                            type: 'ClientStaff',
                            value: $scope.staff.Id
                        }
                    },
                    rStaffRole: function () {
                        return $scope.staff.StaffRole
                    },
                    resetPassword: function () {
                        return true;
                    }
                }
            })
            modalInstance.result.then(function (data) {
                $scope.User = data;
            }, function () {

            });
        };

        function deleteUserAccount() {
            swal({
                title: "Are you sure?",
                text: "User Account will be deleted!",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: $UI.COLOURS.brandSecondary,
                confirmButtonText: "Confirm Delete!",
                closeOnConfirm: true
            }, function () {
                $http.delete($config.API_ENDPOINT + 'api/accountUser?UserName=' + $scope.User.UserName).then(function (response) {
                        $scope.User = null;
                    },
                    function (err) {
                        swal({
                            title: "Some Error Occured.",
                            text: "Some error has occured.",
                            type: "error",
                            confirmButtonColor: $UI.COLOURS.brandSecondary
                        });
                    })
            })
        }

        function openUserModal() {
            if ($scope.staff.Email && $scope.staff.Firstname && $scope.staff.Firstname.trim().length > 0 && ValidateEmail($scope.staff.Email)) {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/user/modal.html',
                    controller: 'UserModalController',
                    resolve: {
                        rUser: function () {
                            return {
                                UserName: $scope.staff.Email,
                                Email: $scope.staff.Email,
                                Name: $scope.staff._Fullname,
                                ImageUrl: $scope.staff.ImageUrl,
                                ClientId: $scope.staff.ClientId,
                                ClientStaffId: $scope.staff.Id
                            }
                        },
                        rClaim: function () {
                            return {
                                type: 'ClientStaff',
                                value: $scope.staff.Id
                            }
                        },
                        rStaffRole: function () {
                            return $scope.staff.StaffRole
                        },
                        resetPassword: function () {
                            return false
                        }
                    }
                })
                modalInstance.result.then(function (data) {
                    $scope.User = data;
                }, function () {

                });
            } else {
                swal({
                    title: "Staff details(email,firstname) Invalid",
                    text: "Please add details correctly",
                    type: "warning",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            }

            function ValidateEmail(mail) {
                if (/^\w+([\.+-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,10})+$/.test(mail)) {
                    return (true)
                }
                return (false)
            }
        }

        function openLinkUserModal() {
                var modalInstance = $modal.open({
                    templateUrl: '/webapp/common/modals/user/link-modal.html',
                    controller: 'LinkUserModalController',
                    resolve: {
                        rData: function () {
                            return {
                                ClientId: $scope.staff.ClientId,
                                StaffId: $scope.staff.Id,
                            }
                        }
                    }
                })
                modalInstance.result.then(function (data) {
                    $scope.User = data;
                }, function () {

                });
        }
    }
}(angular))