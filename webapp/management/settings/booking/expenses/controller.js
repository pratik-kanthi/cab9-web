(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('SettingsBookingExpensesController', settingsBookingExpensesController);

    settingsBookingExpensesController.$inject = ['$scope', '$http', '$config', '$q', 'Model', 'rExpenses', '$modal', 'Auth'];

    function settingsBookingExpensesController($scope, $http, $config, $q, Model, rExpenses, $modal, Auth) {
        $scope.bookingExpenses = rExpenses;

        $scope.addExpenseType = addExpenseType;
        $scope.editExpenseType = editExpenseType;
        $scope.deleteExpenseType = deleteExpenseType;


        function addExpenseType() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/booking/expenses/modal/partial.html',
                controller: 'BookingExpenseTypeCreateController',
                resolve: {
                    rbookingExpenseType: function() {
                        var _be = new Model.BookingExpenseType();
                        return _be;
                    },
                    rTaxes: ['Model', function(Model) {
                        return Model.Tax.query()                                    
                                    .where('TenantId', 'eq', "guid'" + Auth.getSession().TenantId + "'")
                                    .execute()
                    }]
                }
            });

            modalInstance.result.then(function(data) {
                fetchExpenseTypes();
            });
        }

        function editExpenseType(be) {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/settings/booking/expenses/modal/partial.html',
                controller: 'BookingExpenseTypeEditController',
                resolve: {
                    rbookingExpenseType: function() {
                        var _be = new Model.BookingExpenseType(be);
                        return _be;
                    },
                    rTaxes: ['Model', function(Model) {
                        return Model.Tax.query()                                    
                                    .where('TenantId', 'eq', "guid'" + Auth.getSession().TenantId + "'")
                                    .execute()
                    }]
                }
            });

            modalInstance.result.then(function(data) {
                fetchExpenseTypes();
            });
        }

        function deleteExpenseType(be) {
            swal({
                    title: "Are you sure?",
                    text: "This expense type will bepermanentely deleted.",
                    type: "warning",
                    showCancelButton: true,
                    confirmButtonText: "Confirm",
                    closeOnConfirm: false
                },
                function() {
                    var _be = new Model.BookingExpenseType(be);
                    _be.$delete().then(function(response) {
                        swal("Expense Type Deleted", "This expense type has been permanentely deleted.", "info");
                        fetchExpenseTypes();
                    }, function(error) {
                        swal("Delete Error", "There was an error with deleting this expense type. This might already be used on one or more bookings.", "error");
                    });
                });
        }

        function fetchExpenseTypes() {
            Model.BookingExpenseType               
                .query()
                .include('Tax')
                .execute()
                .then(function(response) {
                    $scope.bookingExpenses = response;
                    $scope.$apply();
                });               
        }

    }
}(angular));
