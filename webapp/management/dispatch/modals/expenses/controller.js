(function () {
    var module = angular.module('cab9.dispatch');

    module.controller('DispatchBookingExpensesModalController', DispatchBookingExpensesModalController);

    DispatchBookingExpensesModalController.$inject = ['$scope', '$modalInstance', 'Model', 'rTaxes', 'rExpenseTypes', 'rBooking', '$http', '$config'];
    function DispatchBookingExpensesModalController($scope, $modalInstance, Model, rTaxes, rExpenseTypes, rBooking, $http, $config) {
        $scope.viewMode = 'CREATE';
        $scope.expense = new Model.BookingExpense({ BookingId: rBooking.Id });
        $scope.booking = rBooking;
        $scope.expenseTypes = rExpenseTypes;
        $scope.taxes = rTaxes;

        $scope.save = save;

        function save() {
            $scope.expense.$save().then(function () {
                swal('Expense Added', 'New Expense added to booking.', 'success');
                $modalInstance.dismiss();
            })
        }
    }
}())