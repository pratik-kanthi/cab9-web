(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('UserModalController', userModalController);
    module.controller('LinkUserModalController', LinkUserModalController);

    userModalController.$inject = ['$scope', '$rootScope', '$state', '$config', '$UI', '$http', '$stateParams', '$modalInstance', 'Model', 'rUser', 'resetPassword'];

    function userModalController($scope, $rootScope, $state, $config, $UI, $http, $stateParams, $modalInstance, Model, rUser, resetPassword) {
        $scope.user = rUser;
        $scope.user.Password = randomPassword(8);
        $scope.save = save;
        $scope.reset = reset;
        $scope.displayMode = "CREATE";
        $scope.resetPassword = resetPassword;

        function reset() {
            $http.post($config.API_ENDPOINT + 'api/account/SetPassword', {
                    Id: $scope.user.Id,
                    NewPassword: $scope.user.Password,
                    ConfirmPassword: $scope.user.Password
                })
                .then(function (response) {
                    swal("Success", "Password changed successfully.", "success")
                    $modalInstance.close();
                    $state.go($state.current, $stateParams, {
                        reload: true
                    })
                }, function (err) {
                    swal("An error has occurred.", (err.data.ExceptionMessage)? err.data.ExceptionMessage: 'There was an error processing your request. Please check your field values and try again.', "error");
                });
        }

        function randomPassword(length) {
            var lower = "abcdefghijklmnopqrstuvwxyz";
            var upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            var numbers = "1234567890";
            var totalAvailable = lower + upper + numbers;

            var result = "";

            for (var i = 0; i < 5; i++)
            {
                result += totalAvailable.charAt(Math.floor(Math.random() * 62));
            }
            result += upper.charAt(Math.floor(Math.random() * 26));
            result += lower.charAt(Math.floor(Math.random() * 26));
            result += numbers.charAt(Math.floor(Math.random() * 10));

            var pass = result.split('').sort(function () { return 0.5 - Math.random() }).join('');

            return pass
        }


        function save() {
            $scope.user.PasswordRepeat = $scope.user.Password;
            $http.post($config.API_ENDPOINT + 'api/account', $scope.user)
                .success(function () {
                    swal("User Created", "User has been created.", "success");
                    $modalInstance.close();
                    $state.go($state.current, $stateParams, {
                        reload: true
                    })
                })
                .error(function (err) {
                    swal("An error has occurred.", (err.ExceptionMessage)? err.ExceptionMessage: 'There was an error processing your request. Please check your field values and try again.', "error");
                });
        }

    }

    LinkUserModalController.$inject = ['$scope', '$rootScope', '$state', '$config', '$UI', '$http', '$stateParams', '$modalInstance', 'Model', 'rData'];
    function LinkUserModalController($scope, $rootScope, $state, $config, $UI, $http, $stateParams, $modalInstance, Model, rData) {
        $scope.fetchedUsers = [];
        $scope.info = rData;

        $scope.searchUsers = searchUsers;
        $scope.save = save;

        function searchUsers(searchText) {
            $scope.fetchedUsers.length = 0;
            $http.get($config.API_ENDPOINT + 'api/account/SearchClientUsers', {
                params: {
                    searchText: searchText,
                    clientId: $scope.info.ClientId
                }
            }).then(function (response) {
                [].push.apply($scope.fetchedUsers, response.data);
            });
        }

        function save() {
            $http.post($config.API_ENDPOINT + 'api/account/LinkUser', null, {
                params: {
                    userId: $scope.info.Id,
                    clientId: $scope.info.ClientId,
                    staffId: $scope.info.StaffId
                }
            })
                .success(function () {
                    swal("User Linked", "User has been linked.", "success");
                    $modalInstance.close();
                    $state.go($state.current, $stateParams, {
                        reload: true
                    })
                })
                .error(function (err) {
                    swal("An error has occurred.", (err.ExceptionMessage) ? err.ExceptionMessage : 'There was an error processing your request. Please check your field values and try again.', "error");
                });
        }

    }
}(angular))