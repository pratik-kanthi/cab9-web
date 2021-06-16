(function () {
    var module = angular.module('cab9.common');

    module.controller('ClientInvoicesController', clientInvoicesController);

    clientInvoicesController.$inject = ['$scope', '$modal', '$stateParams', '$state', 'Model', '$timeout'];

    function clientInvoicesController($scope, $modal, $stateParams, $state, Model, $timeout) {
        $scope.invoices = [];
        $scope.searchTerm = {};
        $scope.toggleSearch = toggleSearch;
        $scope.filterInvoices = filterInvoices;
        $scope.showSearch = false;
        $scope.loading = true;

        function filterInvoices() {
            setPage(1);
        }

        function toggleSearch() {
            $scope.showSearch = true;
        }
        $scope.hideOptions = true;
        $scope.start = new moment().subtract(1, 'year');
        $scope.end = new moment().add(1, 'year');
        var debounce = null;
        $scope.paging = {
            currentPage: 1,
            resultsPerPage: 20,
            totalResults: null,
            maxPages: null
        };
        $scope.setPage = setPage;

        $scope.selected = {
            from: new moment().startOf('day'),
            to: new moment().endOf('day'),
            span: 'day',
            status: "Show All"
        };

        $scope.toggleSearch = toggleSearch;

        function toggleSearch() {
            $scope.showSearch = !$scope.showSearch;
            if (!$scope.showSearch) {
                $scope.searchTerm.$ = '';
            } else {
                setTimeout(function () {
                    $('#searchTerm').focus()
                }, 500);
            }
        }

        function setPage(page) {
            $scope.paging.currentPage = page;
            var invoices = angular.copy($scope.invoices);
            if ($scope.searchTerm.$) {
                var invoices = $scope.invoices.filter(function (item) {
                    var str = item.Client.Name + item.Reference + item.Status + item.NoOfBookings + item.DueDate + item._AmountDue;
                    return str.toLowerCase().indexOf($scope.searchTerm.$.toLowerCase()) > -1
                });
            }
            $scope.paging.totalResults = invoices.length;
            $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
            var skip = (page - 1) * $scope.paging.resultsPerPage;
            $scope.pageInvoices = invoices.slice(skip, skip + $scope.paging.resultsPerPage);
            $scope.loading = false;
        }
        $scope.$watchGroup(['selected.span', 'selected.status', 'selected.from.format()', 'selected.to.format()'], function (newvalue, oldvalue) {
            $scope.loading = true;
            var query = Model.Invoice.query()
                .include('Payments,Client')
                .filter('ClientId', 'eq', "guid'" + $stateParams.Id + "'")
                .filter('InvoiceType', 'eq', "'Client'")
                .filter('DueDate', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                .filter('DueDate', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
            if ($scope.selected.status != "Show All") {
                query.filter('Status', 'eq', "'" + $scope.selected.status + "'")
            }
            query
                .select('Id,Reference,Payments/AmountPaid,Client/Name,Client/AccountNo,CreationTime,DueDate,NoOfBookings,Status,AdjustmentsTaxAmount,TotalAmount,AdjustmentsSubTotal,ExtrasTaxAmount,BookingsSubTotal,ExtrasSubTotal,WaitingSubTotal')
                .orderBy('Reference')
                .execute().then(function (data) {
                    $scope.paging.totalResults = data.length;
                    $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                    $scope.invoices = data;
                    $scope.loading = false;
                    setPage(1);
                });
        })

        $scope.viewItem = function ($row) {
            $state.go('root.invoices.viewer', {
                Id: $row.Id
            });
        }
    }
}())