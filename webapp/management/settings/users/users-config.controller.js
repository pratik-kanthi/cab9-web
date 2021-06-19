(function(angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsUsersController', settingsUsersController);
    module.controller('SettingsUserModalController', settingsUserModalController);
    module.filter('ExistingAccounts', userFilter);

    settingsUsersController.$inject = ['$scope', '$modal', '$http', '$config', 'Auth', '$state', 'CSV', '$filter', '$q'];

    function settingsUsersController($scope, $modal, $http, $config, Auth, $state, CSV, $filter, $q) {

        $scope.Users;
        $scope.Schema = 'UserInfo';
        $scope.currentUserId = Auth.getSession().UserId;
        $scope.toggleSearch = toggleSearch;
        $scope.showSearch = false;
        $scope.changePassword = changePassword;
        $scope.lockAccount = lockAccount;
        $scope.unblockAccount = unblockAccount;
        $scope.fetchUsers = fetchUsers;
        $scope.addnewUser = addnewUser;
        $scope.verifyEmail = verifyEmail;
        $scope.searchTerm = {};

        $scope.paging = {
            currentPage: 1,
            maxPerPage: 20,
            totalItems: null,
            maxPages: null
        };


        function fetchUsers(filtering, sorting, grouping, paging, existing) {
            var deferred = $q.defer();
            $http.get($config.API_ENDPOINT + 'api/account/formatted', {
                params: {
                    pageNumber: paging.currentPage,
                    recordsPerPage: paging.maxPerPage,
                    searchTerm: filtering.$,
                    sortBy: (typeof sorting[0] === 'undefined') ? null : sorting[0]
                }
            }).success(function(data) {
                deferred.notify(data.Count);
                data.Users.map(function(user) {
                    if (user.LockoutEndDateUtc != null && moment(user.LockoutEndDateUtc) > new moment()) {
                        user.$Locked = true;
                    } else {
                        user.$Locked = false;
                    }
                });
                deferred.resolve({
                    'undefined': data.Users
                })


            }).error(function(error) {
                swal("Error", error.Message, "error");
            });

            return deferred.promise;
        }

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function() {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function changePassword(userId) {
            $modal.open({
                templateUrl: '/webapp/management/settings/users/user-change-password.modal.html',
                controller: ['$scope', '$modalInstance', function($scope, $modalInstance) {

                    $scope.setNewPassword = function(pswd) {
                        pswd.Id = userId;
                        $http.post($config.API_ENDPOINT + 'api/account/SetPassword', pswd)
                            .success(function() {
                                swal("Success", "Password changed successfully.", "success")
                                $modalInstance.close();
                            })
                            .error(function(res) {
                                swal("Error", "Please ensure passwords match and contain at least 1 uppercase and 1 number character.", "error");
                            });
                    }
                }]
            });
        }

        function lockAccount(user) {
            swal({
                    title: "Lockout Date",
                    text: "Please enter a date until which the user will be locked out. Please format the date as DD/MM/YYYY HH:mm as any other format will not be accepted.",
                    type: "input",
                    inputPlaceholder: "DD/MM/YYYY HH:mm",
                    showCancelButton: true,
                    confirmButtonColor: '#DD6B55',
                    confirmButtonText: 'Yes',
                    cancelButtonText: "No",
                    showLoaderOnConfirm: true,
                    closeOnConfirm: false,
                    closeOnCancel: true
                },
                function(lockedUntil) {
                    if (lockedUntil) {
                        var momentDate = moment(lockedUntil, "DD/MM/YYYY HH:mm");
                        if (momentDate._d == "Invalid Date") {
                            setTimeout(function() {
                                swal("Incorrect Date Format", "Please enter a date until which the user will be locked out. Please format the date as DD/MM/YYYY HH:mm as any other format will not be accepted.", "warning");
                            }, 500);
                        } else {
                            $http({
                                    method: "POST",
                                    url: $config.API_ENDPOINT + "api/account/LockUser?userId=" + user.Id + "&lockedUntil=" + momentDate.format("YYYY-MM-DDTHH:mm")
                                })
                                .success(function(res) {
                                    swal("User Locked", "This user is now locked and will not be able to log into Cab9.", "success");
                                    user.$Locked = true;
                                })
                                .error(function(res) {
                                    swal("Error", (res.Message) ? res.Message : "Some error has occured.", "error");
                                });
                        }
                    }
                });
        }

        function unblockAccount(user) {
            swal({
                title: "Are you sure?",
                text: "The user will be unlocked and will be able to use Cab9. ",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes',
                cancelButtonText: "No",
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
                closeOnCancel: false
            }, function() {
                $http({
                        method: "POST",
                        url: $config.API_ENDPOINT + 'api/account/UnlockUser',
                        params: {
                            UserId: user.Id
                        }
                    })
                    .success(function(res) {
                        swal("User Unlocked", "This user is now ulocked and will be able to log into Cab9.", "success");
                        user.$Locked = false;
                    })
                    .error(function(res) {
                        swal("Error", (res.Message) ? res.Message : "Some error has occured.", "error");
                    });
            });
        }

        function verifyEmail(user) {
            swal({
                title: "Are you sure?",
                text: "The email address of the user will be verified manually.",
                type: "warning",
                showCancelButton: true,
                confirmButtonColor: '#DD6B55',
                confirmButtonText: 'Yes',
                cancelButtonText: "No",
                closeOnConfirm: false,
                showLoaderOnConfirm: true,
                closeOnCancel: false
            }, function() {
                $http({
                        method: "POST",
                        url: $config.API_ENDPOINT + 'api/account/VerifyEmail',
                        params: {
                            UserId: user.Id
                        }
                    })
                    .success(function(res) {
                        swal("Email Verified", "The user email has been verified.", "success");
                        user.EmailConfirmed = true;
                    })
                    .error(function(res) {
                        swal("Error", (res.Message) ? res.Message : "Some error has occured.", "error");
                    });
            });
        }

        function addnewUser() {
            openUserCreateModal();
        }

        function openUserCreateModal(isConfirm) {
            $modal.open({
                templateUrl: '/webapp/management/settings/users/user-create.modal.html',
                controller: 'SettingsUserModalController'
            }).result.then(function() {
                $state.go('root.settings.users', null, {
                    reload: true
                });
            }, function() {

            });
        }
    }

    settingsUserModalController.$inject = ['$scope', '$modalInstance', '$http'];

    function settingsUserModalController($scope, $modalInstance, $http) {

        $scope.nUsers = [];
        $scope.user = {};
        $scope.setUser = setUser;
        $scope.newUsers = newUsers;

        $scope.formCheck = formCheck;

        $scope.back = back;
        $scope.reset = reset;

        $scope.data = {
            selectedOption: null
        };
        
        $scope.type;

        $scope.userTypes = [{
            id: 1,
            Name: 'Driver'
        }, {
            id: 2,
            Name: 'ClientStaff'
        }, {
            id: 3,
            Name: 'Passenger'
        }, {
            id: 4,
            Name: 'Staff'
        }];

        $scope.stage = 1;

        $scope.filters = {
            searchTerm: '',
            Type: null,
            pageNumber: 1,
            recordsPerPage: 10
        };

        function reset(item, model) {
            $scope.stage++;
            $scope.type = item.Name;
            $scope.user = null
            $scope.nUsers = [];

            if (!$scope.user)
                $scope.user = {
                    Email: null
                };
        }


        function formCheck() {
            if (!$scope.user.UserName || !$scope.user.Password || !$scope.user.PasswordRepeat || !$scope.user.Email) {
                return false;
            }

            if($scope.user.Password != $scope.user.PasswordRepeat) {
                return false;
            }

            return true;
        }

        function setUser(user) {
            $scope.user = user;
            $scope.user.Name = (user.Firstname + ' ' + user.Surname).replace(' null', '');


            switch($scope.data.selectedOption.id) {
                case 1:
                    $scope.user.DriverId = user.Id
                    break;
                case 2:
                    $scope.user.ClientStaffId = user.Id
                    break;
                case 3:
                    $scope.user.PassengerId = user.Id
                    break;
                case 4:
                    $scope.user.StaffId = user.Id
                    break;
            }
        }

        function back() {
            $scope.nUsers = [];
            $scope.user = {};
            $scope.stage--
        }

        function newUsers(searchTerm) {

            if (searchTerm.length > 2) {
                $http.get($config.API_ENDPOINT + 'api/Account/entities-without-users', {
                    params: {
                        type: $scope.type,
                        searchTerm: searchTerm
                    }
                }).success(function(data) {
                    $scope.nUsers = data;
                }).error(function(error) {
                    swal("Error", error.Message, "error");
                });
            }
        }

        $scope.save = function() {

            $http.post($config.API_ENDPOINT + 'api/account', $scope.user)
                .success(function() {
                    $scope.stage++
                    swal("User Created", "User has been created.", "success");
                    $modalInstance.close();
                })
                .error(function(err) {
                    swal("An error has occurred.", (err.ExceptionMessage)? err.ExceptionMessage: 'There was an error creating the user. Please check your field values and try again.', "error");
                });
        }

    }

    function userFilter() {
        return function(items, existing) {
            angular.forEach(items, function(item, index) {
                angular.forEach(existing, function(eItem) {
                    if (item.Id.toUpperCase() == eItem.ClaimValue.toUpperCase()) {
                        items.splice(index, 1);
                    }
                });
            });
            return items;
        };
    }
}(angular));