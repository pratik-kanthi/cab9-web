(function () {
    var module = angular.module('cab9.client.invoices');

    module.controller('InvoicesModuleTableController', invoicesModuleTableController);

    invoicesModuleTableController.$inject = ['$scope', 'rInvoices', '$state', 'Model'];
    function invoicesModuleTableController($scope, rInvoices, $state, Model) {
        $scope.invoices = rInvoices;

        $scope.start = new moment().subtract(1, 'year');
        $scope.end = new moment().add(1, 'year');
        $scope.selected = {
            from: new moment().startOf('month'),
            to: new moment().endOf('month'),
            span: 'month'
        };

        $scope.toggleSearch = toggleSearch;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            }
            else {
                setTimeout(function () { $('#searchTerm').focus() }, 500);
            }
        }

        $scope.$watch('selected', function (newvalue) {
            $scope.invoices = Model.Invoice.query()
                .include('Payments')
                .include('Client')
                .filter('InvoiceType', 'eq', "'Client'")
                .filter('ClientId', '==', "guid'" + $scope.CLIENTID + "'")
                .filter('CreationTime', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                .filter('CreationTime', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                .execute().then(function (data) {
                    $scope.invoices = data;
                })
        }, true)

        $scope.viewItem = function ($row) {
            $state.go('root.invoices.viewer', { Id: $row.Id });
        }
    }
}())