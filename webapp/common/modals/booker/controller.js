(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('BookerCreateController', bookerCreateController);
    module.controller('BookerEditController', bookerEditController);

    bookerCreateController.$inject = ['$scope', '$UI', '$modalInstance', '$config', '$q', 'Model', 'rBooker', '$http', '$timeout'];
    bookerEditController.$inject = ['$scope', '$UI', '$modalInstance', '$config', '$q', 'Model', 'rBooker'];

    function bookerEditController($scope, $UI, $modalInstance, $config, $q, Model, rBooker) {
        $scope.booker = rBooker[0];
        $scope.save = save;
        $scope.edit = true;

        function save() {
            $scope.booker.$patch().then(function (response) {
                $modalInstance.close(response.data);
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }
    }

    function bookerCreateController($scope, $UI, $modalInstance, $config, $q, Model, rBooker, $http, $timeout) {
        $scope.booker = rBooker;
        $scope.save = save;
        $scope.duplicates = [];
        $scope.useExisting = useExisting;
        $scope.booker.AllPassengers = false;
        Model.ClientStaffRole.query().select('Id').filter("Name eq 'Booker'").execute().then(function (response) {
            $scope.booker.ClientStaffRoleId = response[0].Id;
        }, function (err) {
            swal({
                title: "Some Error Occured.",
                text: "Some error has occured.",
                type: "error",
                confirmButtonColor: $UI.COLOURS.brandSecondary
            });
        });

        var debounce = null;

        $scope.$watch('booker', function () {
            if (debounce) {
                $timeout.cancel(debounce);
                debounce = null;
            }

            $scope.duplicates = [];
            if ($scope.booker.Firstname || $scope.booker.Surname || $scope.booker.Phone || $scope.booker.Mobile || $scope.booker.Email) {
                debounce = $timeout(function () {
                    $http.post($config.API_ENDPOINT + 'api/client/bookerduplicates', $scope.booker)
                        .then(function (response) {
                            $scope.duplicates = response.data;
                        });
                }, 500);
            }
        }, true);

        function useExisting(pax) {
            $modalInstance.close(pax);
        }

        function save() {
            $scope.booker.$save().then(function (response) {
                swal({
                    title: "Booker Saved",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $modalInstance.close(response.data);
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }
    }

}(angular))