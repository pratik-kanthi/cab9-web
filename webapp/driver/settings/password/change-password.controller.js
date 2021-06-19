(function (angular) {
    var module = angular.module('cab9.driver.settings');
    module.controller('SettingsPasswordController', settingsPasswordController);

    settingsPasswordController.$inject = ['$scope', '$http', '$config', '$state', '$rootScope', 'AUTH_EVENTS', 'Auth'];

    function settingsPasswordController($scope, $http, $config, $state, $rootScope, AUTH_EVENTS, Auth) {
        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.user = {
            UserName: Auth.getSession().UserName
        };

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.user = {
                UserName: Auth.getSession().UserName
            };
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $http.put($config.API_ENDPOINT + 'api/account', $scope.user)
                .success(function (data) {
                    swal({
                        title: "Password updated",
                        text: "Try login using new password!",
                        type: "success"
                    }, function (res) {
                        $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
                    });
                })
                .error(function (res) {
                    swal("Error", "Something didn't work, please check input and try again", "error");
                })
        }
    }
}(angular));
