(function () {
    var module = angular.module('cab9.invoices');

    module.controller('CreditsModuleTableController', CreditsModuleTableController);

    CreditsModuleTableController.$inject = ['$scope', '$modal', '$state', 'Model', '$timeout'];

    function CreditsModuleTableController($scope, $modal, $state, Model, $timeout) {
        $scope.credits = [];
        $scope.searchTerm = {};
        $scope.toggleSearch = toggleSearch;
        $scope.showSearch = false;

        function toggleSearch() {
            $scope.showSearch = true;
        }
        $scope.openPaymentModal = openPaymentModal;
        $scope.start = new moment().subtract(2, 'year');
        $scope.end = new moment().add(1, 'year');
        var debounce = null;
        $scope.paging = {
            currentPage: 1,
            totalItems: 0,
            maxPerPage: 25
        };

        function openPaymentModal() {
            var modalInstance = $modal.open({
                templateUrl: '/webapp/management/invoicing/creditnotes/modals/new-creditnote/partial.html',
                controller: 'NewCreditNoteController',
                keyboard: false,
                backdrop: 'static',
                size: 'lg',
                resolve: {
                    rClients: ['Model', function (Model) {
                        return Model.Client
                            .query()
                            .select('Id,Name,ImageUrl,ClientType/Name,AccountNo')
                            .include('ClientType')
                            .parseAs(function (item) {
                                this.Id = item.Id;
                                this.Name = item.Name;
                                this.AccountNo = item.AccountNo;
                                this.Description = item.ClientType.Name;
                                this.ImageUrl = formatUrl(item.ImageUrl, item.Name);
                            })
                            .execute();
                    }],
                    rTaxes: ['Model', function (Model) {
                        return Model.Tax
                            .query()
                            .include('TaxComponents')
                            .execute();
                    }]
                }
            })

            modalInstance.result.then(function (data) {
                if (debounce) {
                    $timeout.cancel(debounce);
                }
                debounce = $timeout(function () {
                    Model.CreditNote.query()
                        .include('Client')
                        .include('Tax')
                        .include('Tax/TaxComponents')
                        .filter('TaxDate', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                        .filter('TaxDate', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                        .orderBy('Reference')
                        .execute().then(function (data) {
                            $scope.credits = data;
                            debounce = null;
                        });
                }, 500);
            }, function () {});
        }

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

        $scope.$watchGroup(['selected.span', 'selected.from.format()', 'selected.to.format()'], function (newvalue, oldvalue) {
            if (debounce) {
                $timeout.cancel(debounce);
            }
            debounce = $timeout(function () {
                Model.CreditNote.query()
                    .include('Client')
                    .include('Tax')
                    .include('Tax/TaxComponents')
                    .filter('TaxDate', 'ge', "datetimeoffset'" + $scope.selected.from.format() + "'")
                    .filter('TaxDate', 'le', "datetimeoffset'" + $scope.selected.to.format() + "'")
                    .orderBy('Reference')
                    .execute().then(function (data) {
                        $scope.credits = data;
                        debounce = null;
                    });
            }, 500);
        })

        $scope.viewItem = function ($row) {
            $state.go('root.creditnotes.viewer', {
                Id: $row.Id
            });
        }
    }
}())