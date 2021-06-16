(function (angular) {
    var module = angular.module('cab9.client.settings');

    module.controller('SettingsProfileController', settingsProfileController);

    settingsProfileController.$inject = ['$scope', 'AUTH_EVENTS', 'Auth', '$http', 'rData', '$rootScope'];

    function settingsProfileController($scope, AUTH_EVENTS, Auth, $http, rData, $rootScope) {
        $scope.accessors = {
            LogoUrl: function () {
                return rData[0]._ImageUrl;
            }
        };
        $scope.Name = rData[0].Name;
        $scope.viewMode = 'EDIT';
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.user = {
            UserName: Auth.getSession().UserName
        };

        function cancelEdit() {
            $scope.viewMode = 'EDIT';
            $scope.user = {
                UserName: Auth.getSession().UserName
            };
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
})(angular);