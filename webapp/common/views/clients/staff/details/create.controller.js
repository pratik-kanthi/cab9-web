(function (angular) {
    var module = angular.module('cab9.common');

    module.controller('ClientStaffItemCreateController', clientStaffItemCreateController);

    clientStaffItemCreateController.$inject = ['$scope', '$rootScope', '$state', '$stateParams', '$q', '$config', '$UI', '$http', 'Model', 'rRoles'];

    function clientStaffItemCreateController($scope, $rootScope, $state, $stateParams, $q, $config, $UI, $http, Model, rRoles) {
        $scope.staff = new Model.ClientStaff();
        $scope.viewMode = "CREATE";

        if ($stateParams.superAdmin) {
            $scope.staff.AllPassengers = true;
            $scope.superAdmin = true;
            $scope.roles = rRoles.filter(function (item) {
                return item.Name == "Super Admin"
            });
            if ($scope.roles[0])
                $scope.staff.ClientStaffRoleId = $scope.roles[0].Id;
            else {
                new Model.ClientStaffRole({
                    Name: "Super Admin",
                    Description: "May Administer a clients account."
                }).$save().then(function (response) {
                    $scope.roles.push(response.data)
                    $scope.staff.ClientStaffRoleId = response.data.Id;
                }, function (err) {
                    swal({
                        title: "Some Error Occured.",
                        text: "Some error has occured.",
                        type: "error",
                        confirmButtonColor: $UI.COLOURS.brandSecondary
                    });
                })
            }
        } else
            $scope.roles = rRoles.filter(function (item) {
                return item.Name != "Super Admin"
            });

        $scope.cancelEdit = cancelEdit;
        $scope.save = save;
        $rootScope.backAvailable = $stateParams.Id ? "root.clients.viewer.staff.cards({Id:'" + $stateParams.Id + "'})" : "root.staff.cards";

        function save() {
            $scope.staff.ClientId = $stateParams.Id ? $stateParams.Id : $rootScope.CLIENTID;
            $scope.staff.$save().then(function (response) {
                swal({
                    title: "Staff Saved",
                    text: "Changes have been updated.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                if ($stateParams.Id)
                    $state.go("root.clients.viewer.staff.viewer.details", {
                        sId: response.data.Id
                    });
                else
                    $state.go("root.staff.viewer.details", {
                        sId: response.data.Id
                    })
            }, function (err) {
                swal({
                    title: "Some Error Occured.",
                    text: "Some error has occured.",
                    type: "error",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
            })
        }

        function cancelEdit() {
            if ($stateParams.Id)
                $state.go("root.clients.viewer.staff.cards", {
                    Id: $stateParams.Id
                });
            else
                $state.go("root.staff.cards")
        }
    }
}(angular));