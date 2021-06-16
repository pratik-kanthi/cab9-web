(function () {
    var module = angular.module('cab9.common');

    module.controller('ClientCreditNotesController', ClientCreditNotesController);

    ClientCreditNotesController.$inject = ['$scope', '$modal', '$stateParams', '$state', 'Model', '$timeout'];

    function ClientCreditNotesController($scope, $modal, $stateParams, $state, Model, $timeout) {
        $scope.creditNotes = [];
        $scope.searchTerm = {};
        $scope.toggleSearch = toggleSearch;
        $scope.filterCreditNotes = filterCreditNotes;
        $scope.showSearch = false;
        $scope.loading = true;

        function filterCreditNotes() {
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
            span: 'day'
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
            var creditNotes = angular.copy($scope.creditNotes);
            if ($scope.searchTerm.$) {
                creditNotes = $scope.creditNotes.filter(function (item) {
                    var str = item.Client.Name + item.Reference + item.Status + item.NoOfBookings + item.DueDate + item._AmountDue;
                    return str.toLowerCase().indexOf($scope.searchTerm.$.toLowerCase()) > -1
                });
            }
            $scope.paging.totalResults = creditNotes.length;
            $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
            var skip = (page - 1) * $scope.paging.resultsPerPage;
            $scope.pageCreditNotes = creditNotes.slice(skip, skip + $scope.paging.resultsPerPage);
            $scope.loading = false;
        }
        $scope.$watchGroup(['selected.span', 'selected.status', 'selected.from.format()', 'selected.to.format()'], function (newvalue, oldvalue) {
            $scope.loading = true;
            var query = Model.CreditNote.query()
                .include('Client')
                .filter('ClientId', 'eq', "guid'" + $stateParams.Id + "'")
                .filter('TaxDate', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                .filter('TaxDate', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                .select('Id,Reference,Description,CreationTime,TaxDate,Amount,Tax')
                .orderBy('Reference')
                .execute().then(function (data) {
                    $scope.paging.totalResults = data.length;
                    $scope.paging.maxPages = Math.ceil($scope.paging.totalResults / $scope.paging.resultsPerPage);
                    $scope.creditNotes = data;
                    $scope.loading = false;
                    setPage(1);
                });
        })

        $scope.viewItem = function ($row) {
            $state.go('root.creditnotes.viewer', {
                Id: $row.Id
            });
        }
    }
}())