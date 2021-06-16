(function (angular) {
    var module = angular.module('cab9.invoices');

    module.controller('NewCreditNoteController', NewCreditNoteController);
    NewCreditNoteController.$inject = ['$scope', '$state', '$UI', '$q', 'Model', '$stateParams', '$modalInstance', 'rClients', 'rTaxes'];

    function NewCreditNoteController($scope, $state, $UI, $q, Model, $stateParams, $modalInstance, rClients, rTaxes) {
        $scope.creditNote = new Model.CreditNote();
        $scope.taxes = rTaxes;
        $scope.creditNote.TaxId = $scope.COMPANY.DefaultTaxId;
        $scope.clients = rClients;
        $scope.displayMode = 'CREATE';
        
        $scope.save = save;

        function save() {
            var test = new moment('2000-01-01T00:00:00Z');
            var actual = new moment($scope.creditNote.TaxDate);
            if (test.isAfter(actual)) {
                $scope.creditNote.TaxDate = actual.add(100, 'years').toDate();
            }
            $scope.creditNote.$save().then(function (response) {
                swal('Saved!', 'New Credit note has been saved, Reference: ' + response.data.Reference + '.', 'success');
                $modalInstance.close();
            }, function () {
                swal('Error!', 'An error has occured.', 'error');
            })
        }
    }
}(angular))