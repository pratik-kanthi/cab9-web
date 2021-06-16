(function (window, angular) {
    var module = angular.module('cab9.invoices')
    module.controller('DriverInvoiceTableController', DriverInvoiceTableController);

    DriverInvoiceTableController.$inject = ['$scope', '$http', '$config', '$timeout', 'Model', '$state', '$UI', 'CSV', '$filter', '$q', '$modal'];
    function DriverInvoiceTableController($scope, $http, $config, $timeout, Model, $state, $UI, CSV, $filter, $q, $modal) {
        $scope.results = null;
        $scope.paging = {
            currentPage: 1,
            totalItems: 10000,
            maxPerPage: 30
        };

        $scope.open = {};

        $scope.filters = {
            from: new moment().subtract(28, 'days').startOf('day').toDate(),
            to: new moment().endOf('day').toDate(),
            driverId: null,
            status: null
        };

        $scope.drivers = [];
        $scope.statuses = [{ Id: null, Name: 'All Statuses' } ,{ Id: 0, Name: 'Draft' }, { Id: 1, Name: 'Approved' }, { Id: 2, Name: 'Pending' }, { Id: 3, Name: 'Settled' }];

        $scope.searchDrivers = searchDrivers;
        function searchDrivers(searchText) {
            $scope.drivers.length = 0;
            if (searchText)
                Model.Driver
                    .query()
                    .where("substringof('" + searchText + "', concat(concat(Firstname, ' '), Surname)) or substringof('" + searchText + "', Callsign)")
                    .select('Id,Firstname,Surname,Callsign,SupplierNo')
                    .include('DriverType')
                    .execute().then(function (data) {
                        [].push.apply($scope.drivers, data);
                    });
        }

        function getCount() {
            $http.get($config.API_ENDPOINT + "api/invoice/driver/count", {
                params: {
                    from: $scope.filters.from,
                    to: $scope.filters.to,
                    driverId: $scope.filters.driverId,
                    status: $scope.filters.status
                }
            }).then(function (response) {
                $scope.paging.totalItems = response.data;
            });
        }

        function setPage(page) {
            $scope.results = null;

            var skip = (page - 1) * $scope.paging.maxPerPage;

            $http.get($config.API_ENDPOINT + "api/invoice/driver", {
                params: {
                    from: $scope.filters.from,
                    to: $scope.filters.to,
                    driverId: $scope.filters.driverId,
                    status: $scope.filters.status,
                    top: $scope.paging.maxPerPage,
                    skip: skip
                }
            }).then(function (response) {
                $scope.results = response.data;
            });
        }

        $scope.$watch('filters', function () {
            getCount();
            setPage(1);
        }, true);

        $scope.$watch('paging.currentPage', setPage);
    }
}(window, angular));