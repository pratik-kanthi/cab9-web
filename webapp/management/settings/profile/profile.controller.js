(function(angular) {
    var module = angular.module('cab9.settings');
    module.controller('SettingsProfileController', settingsProfileController);

    settingsProfileController.$inject = ['$scope', '$http', '$config', '$state', '$rootScope', 'AUTH_EVENTS', 'Auth'];

    function settingsProfileController($scope, $http, $config, $state, $rootScope, AUTH_EVENTS, Auth) {
        $scope.viewMode = 'VIEW';
        $scope.startEdit = startEdit;
        $scope.cancelEdit = cancelEdit;
        $scope.saveEdits = saveEdits;
        $scope.user = {
        	UserName : Auth.getSession().UserName
        };

        function startEdit() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEdit() {
            $scope.user = {
        		UserName : Auth.getSession().UserName
        	};
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            $http.put($config.API_ENDPOINT + 'api/account', $scope.user)
                .success(function(data) {
                    swal({
                        title: "Password updated",
                        text: "Try login using new password!",
                        type: "success"
                    }, function(res) {
                        $rootScope.$broadcast(AUTH_EVENTS.LOGOUT);
                    });
                })
                .error(function(err) {
                    swal("An error has occurred.", (err.ExceptionMessage)? err.ExceptionMessage: 'There was an error processing your request. Please check your field values and try again.', "error");
                })
        }
    }
}(angular));
