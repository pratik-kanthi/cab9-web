(function(angular) {
    var module = angular.module('cab9.vehicles');

    module.controller('VehiclePagedTableController', VehiclePagedTableController);


    VehiclePagedTableController.$inject = ['$scope', 'rQuery', 'rNavTo', 'rSchema', 'rServerSearch', 'rColumns', '$state', '$q', 'rId', 'rVehicleTypes'];

    function VehiclePagedTableController($scope, rQuery, rNavTo, rSchema, rServerSearch, rColumns, $state, $q, rId, rVehicleTypes) {
        var query = rQuery.clone();
        $scope.viewItem = viewItem;
        $scope.Schema = rSchema;
        $scope.customColumns = rColumns;
        $scope.rId = rId;
        $scope.vehicleTypes = rVehicleTypes;

        $scope.items = rQuery;

        
        $scope.$watchGroup(['serverSearchTerm.$','chosenVehicleType'], function(newvalue, oldvalue) {

            var query = rQuery.clone();

            if($scope.chosenVehicleType) {
                query.where("VehicleTypeId eq guid'" + $scope.chosenVehicleType + "'");
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
