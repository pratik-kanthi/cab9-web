(function (angular) {
    var module = angular.module('cab9.settings');

    module.controller('BookingExpenseTypeCreateController', bookingExpenseTypeCreateController);
    module.controller('BookingExpenseTypeEditController', bookingExpenseTypeEditController);

    bookingExpenseTypeCreateController.$inject = ['$scope', '$UI', '$modalInstance', '$config', '$q', 'Model', 'rbookingExpenseType', 'rTaxes','Auth'];
    bookingExpenseTypeEditController.$inject = ['$scope', '$UI', '$modalInstance', '$config', '$q', 'Model', 'rbookingExpenseType', 'rTaxes','Auth'];

    function bookingExpenseTypeEditController($scope, $UI, $modalInstance, $config, $q, Model, rbookingExpenseType,rTaxes,Auth) {
        $scope.bookingExpenseType = rbookingExpenseType;
        $scope.Taxes = rTaxes;
        $scope.save = save;
        $scope.edit = true;

        function save() {
            $scope.bookingExpenseType.$patch().then(function (response) {
                swal("Expense Type Updated", "This expense type has been updated.", "success");
                $modalInstance.close();
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

    function bookingExpenseTypeCreateController($scope, $UI, $modalInstance, $config, $q, Model, rbookingExpenseType,rTaxes) {
        $scope.bookingExpenseType = rbookingExpenseType;
        $scope.Taxes = rTaxes;
        $scope.save = save;

        function save() {
            $scope.bookingExpenseType.$save().then(function (response) {
                                                swal("Expense Type Saved", "This expense type has been saved.", "success");
                                                $modalInstance.close();
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