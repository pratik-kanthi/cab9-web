(function (angular) {
    var module = angular.module('cab9.passenger.profile');

    module.controller('ProfileController', profileController);
    profileController.$inject = ['$scope', 'rData', 'ImageUpload', '$UI', '$q', 'Model', 'Auth', '$rootScope', '$http', 'AUTH_EVENTS'];
    function profileController($scope, rData, ImageUpload, $UI, $q, Model, Auth, $rootScope, $http, AUTH_EVENTS) {
        $scope.passenger = rData[0];

        $scope.accessors = {
            LogoUrl: function () {
                return rData[0]._ImageUrl;
            }
        };
        $scope.user = {
            UserName: Auth.getSession().UserName
        };

        $scope.viewMode = 'VIEW';
        $scope.displayMode = 'VIEW';

        if (!$scope.passenger.HomeAddressId) {
            $scope.passenger.HomeAddress = new Model.PassengerAddress();
            $scope.passenger.HomeAddress.PassengerId = $scope.passenger.Id;
        }
        if (!$scope.passenger.WorkAddressId) {
            $scope.passenger.WorkAddress = new Model.PassengerAddress();
            $scope.passenger.WorkAddress.PassengerId = $scope.passenger.Id;
        }
                
        $scope.chooseImage = chooseImage;
        $scope.startEditing = startEditing;
        $scope.cancelEditing = cancelEditing;
        $scope.saveEdits = saveEdits;
        $scope.cancelChangePassword = cancelChangePassword;
        $scope.savePassword = savePassword;

        function chooseImage() {
            ImageUpload.openPicker({
                type: 'Passenger',
                id: $scope.passenger.Id,
                searchTerm: $scope.passenger._Fullname
            })
                .then(function (result) {
                    $scope.passenger.ImageUrl = result;
                    saveEdits();
                }, function (result) { });
        };

        function startEditing() {
            $scope.viewMode = 'EDIT';
        }

        function cancelEditing() {
            $scope.passenger.$rollback(true);
            $scope.viewMode = 'VIEW';
        }

        function saveEdits() {
            var promises = [];
            
            if ($scope.passenger.HomeAddress && !$scope.passenger.HomeAddress.StopSummary)
                $scope.passenger.HomeAddress = null;

            if ($scope.passenger.WorkAddress && !$scope.passenger.WorkAddress.StopSummary)
                $scope.passenger.WorkAddress = null;

            promises.push($scope.passenger.$patch());

            $q.all(promises).then(function () {
                swal({
                    title: "Profile Saved.",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $scope.viewMode = 'VIEW';
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }

        function cancelChangePassword() {
            $scope.user = {
                UserName: Auth.getSession().UserName
            };
        }

        function savePassword() {
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