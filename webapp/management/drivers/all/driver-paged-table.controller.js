(function(angular) {
    var module = angular.module('cab9.drivers');

    module.controller('DriverPagedTableController', DriverPagedTableController);


    DriverPagedTableController.$inject = ['$scope', 'rQuery', 'rNavTo', 'rSchema', 'rServerSearch', 'rColumns', '$state', '$q', 'rId', 'rDriverTypes'];

    function DriverPagedTableController($scope, rQuery, rNavTo, rSchema, rServerSearch, rColumns, $state, $q, rId, rDriverTypes) {
        var query = rQuery.clone();
        $scope.viewItem = viewItem;
        $scope.Schema = rSchema;
        $scope.customColumns = rColumns;
        $scope.rId = rId;
        $scope.driverTypes = rDriverTypes;

        $scope.items = rQuery;

        
        $scope.$watchGroup(['serverSearchTerm.$','chosenDriverType'], function(newvalue, oldvalue) {

            var query = rQuery.clone();

            if($scope.chosenDriverType) {
                query.where("DriverTypeId eq guid'" + $scope.chosenDriverType + "'");
            }

            if ($scope.serverSearchTerm.$) {
                $scope.items = rServerSearch(query.clone(), { $: $scope.serverSearchTerm.$ });
            } else if ($scope.serverSearchTerm.$ != oldvalue) {
                $scope.items = query.clone();
            }
            $scope.items.clone({ filters: true }).select('Id').raw().execute().then(function(data) {
                $scope.paging.totalItems = data.length;
                $scope.paging.maxPages = Math.ceil(data.length / $scope.paging.maxPerPage);
            });
        });
        

        $scope.fetchStatus = "Fetching";
        $scope.paging = {
            currentPage: 1,
            maxPerPage: 50,
            totalItems: null,
            maxPages: null
        };

        $scope.state = rNavTo;

        function viewItem(item) {
            var options = {};
            options[rId] = item.Id;
            $state.go(rNavTo, options);
        }
    }

})(angular);
