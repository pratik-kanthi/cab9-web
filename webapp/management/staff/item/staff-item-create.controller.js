(function (angular) {
    var module = angular.module('cab9.staff');

    module.controller('StaffItemCreateController', staffItemCreateController);

    staffItemCreateController.$inject = ['$scope', '$state', 'Model', 'rCustomRoles', '$UI', '$q'];
    function staffItemCreateController($scope, $state, Model, rCustomRoles, $UI, $q) {
        $scope.customRoles = rCustomRoles;
        $scope.staff = new Model.Staff();
        $scope.displayMode = "CREATE";

        $scope.saveEdits = saveEdits;
        $scope.cancelEditing = cancelEditing;  

        function saveEdits() {
            var promises = [];

            promises.push($scope.staff.$save());

            $q.all(promises).then(function () {

                swal({
                    title: "Staff Saved.",
                    text: "New Staff has been added.",
                    type: "success",
                    confirmButtonColor: $UI.COLOURS.brandSecondary
                });
                $state.go('root.staff.cards', null, { reload: true });
            }, function () {
                alert('Error');
                console.log(arguments);
            });
        }

        function cancelEditing() {
            $state.go('root.staff.cards');
        }

    }
})(angular);
