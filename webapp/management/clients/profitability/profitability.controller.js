(function () {
    var module = angular.module('cab9.clients');

    module.controller('ClientProfitabilityController', ClientProfitabilityController);

    ClientProfitabilityController.$inject = ['$scope', '$http', '$config', '$timeout', '$filter', '$parse'];

    function ClientProfitabilityController($scope, $http, $config, $timeout, $filter, $parse) {
        $scope.periods = null;
        var rawData = null;
        $scope.clients = null;
        $scope.getColour = getColour;
        $scope.toggleSearch = toggleSearch;
        $scope.searchTerm = {
            ViewMode: true,
            Order: 'TotalProfit',
            OrderReverse: true,
        };
        $scope.move = move;
        $scope.offset = 0;
        $scope.paging = {
            currentPage: 1,
            maxPerPage: 20,
            totalItems: 0
        };
        $scope.setOrdering = setOrdering;

        move();

        var debounce = null;

        function setOrdering(month, year) {
            var newOrder = '';
            if ($scope.searchTerm.ViewMode) {
                if (!year) {
                    newOrder = 'Average';
                } else {
                    newOrder = "Months['" + month + "'].Weeks['" + year + "'].Change || -10000";
                }
            } else {
                if (!year) {
                    newOrder = 'TotalProfit';
                } else {
                    newOrder = "Months['" + month + "'].Weeks['" + year + "'].TotalProfit || -10000";
                }
            }

            if ($scope.searchTerm.Order == newOrder) {
                $scope.searchTerm.OrderReverse = !$scope.searchTerm.OrderReverse; 
            } else {
                $scope.searchTerm.OrderReverse = true;
            }
            $scope.searchTerm.Order = newOrder;
            updateData();
        }

        function move(direction) {
            if (direction == '-') {
                $scope.offset++;
            } else if (direction == '+') {
                $scope.offset--;
            }
            if ($scope.offset < 0) {
                $scope.offset = 0;
            }
            if (debounce) {
                $timeout.cancel(debounce);
                debounce = null;
            }
            
            $timeout(function () {
                $scope.periods = null;
                $scope.clients = null;
                rawData = null;
                $http.get($config.API_ENDPOINT + 'api/client/profitability', {
                    params: {
                        to: new moment().subtract($scope.offset, 'weeks').format('YYYY-MM-DD')
                    }
                }).then(function (response) {
                    $scope.periods = response.data.Totals;
                    rawData = response.data.Data;
                    $scope.paging.totalItems = response.data.Data.length;
                    updateData();
                });
            }, 500); 
        }


        $scope.$watchGroup(['searchTerm.Account', 'searchTerm.Bookings', 'paging.currentPage'], updateData);

        function updateData() {
            if (!rawData) return;
            var filtered = rawData;
            if ($scope.searchTerm.Account) {
                var search = $scope.searchTerm.Account.toLowerCase();
                filtered = filtered.filter(function (item) {
                    return (item.ClientAccount.toLowerCase().indexOf(search) != -1) || (item.ClientName.toLowerCase().indexOf(search) != -1)
                });
            }
            if ($scope.searchTerm.Bookings) {
                filtered = filtered.filter(function (item) {
                    return item.Bookings >= $scope.searchTerm.Bookings;
                });
            }

            $scope.paging.totalItems = filtered.length;

            if ($scope.searchTerm.Order) {
                filtered = $filter('orderBy')(filtered, $scope.searchTerm.Order, $scope.searchTerm.OrderReverse);
            }

            var skip = ($scope.paging.currentPage - 1) * $scope.paging.maxPerPage;
            filtered = filtered.slice(skip, skip + $scope.paging.maxPerPage);

            $scope.clients = filtered;
        }
        
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

        function getColour(amount, max, min) {
            if (amount === null) {
                return 'rgba(0,180,0,1)';
            } else if (amount === undefined) {
                return 'rgba(210,210,210,0.2)';
            } else if (amount > 0) {
                return 'rgba(0,180,0,' + (amount / max / 1.5) + ')';
            } else {
                return 'rgba(180,0,0,' + (Math.abs(amount) / Math.abs(min) / 1.5) + ')';
            }
            
        }
    }
}())