(function(angular) {
    var module = angular.module('framework.UI.module');

    module.controller('ModuleTableController', ModuleTableController);
    module.controller('ModulePagedTableController', ModulePagedTableController);

    ModuleTableController.$inject = ['$scope', 'rData', 'rNavTo', 'rSchema', 'rColumns', '$state', '$q'];

    function ModuleTableController($scope, rData, rNavTo, rSchema, rColumns, $state, $q) {
        $scope.items = rData;
        var state = $state.$current.name.substring(5).split('.');
        if (state.length > 0 && state[1] == "table")
            $scope.state = state[0] + '.viewer';

        function n() {
            console.log(arguments);
            return $q.when(rData);
        };

        if (rData.pullMore) {
            rData.pullMore.execute().then(function(data) {
                $scope.items = data;
            });

        }

        $scope.viewItem = viewItem;
        $scope.Schema = rSchema;

        $scope.customColumns = rColumns;

        function viewItem(item) {
            $state.go(rNavTo, { Id: item.Id });
        }
    }

    ModulePagedTableController.$inject = ['$scope', 'rQuery', 'rNavTo', 'rSchema', 'rServerSearch', 'rColumns', '$state', '$q', 'rId'];

    function ModulePagedTableController($scope, rQuery, rNavTo, rSchema, rServerSearch, rColumns, $state, $q, rId) {
        var query = rQuery.clone();
        $scope.viewItem = viewItem;
        $scope.Schema = rSchema;
        $scope.customColumns = rColumns;
        $scope.rId = rId;

        $scope.items = rQuery;

        if ($scope.serverSearchTerm && angular.isFunction(rServerSearch)) {
            $scope.$watch('serverSearchTerm.$', function(newvalue, oldvalue) {
                if (newvalue) {
                    $scope.items = rServerSearch(rQuery.clone(), { $: newvalue });
                } else if (newvalue != oldvalue) {
                    $scope.items = rQuery.clone();
                }
                $scope.items.clone({ filters: true }).select('Id').raw().execute().then(function(data) {
                    $scope.paging.totalItems = data.length;
                    $scope.paging.maxPages = Math.ceil(data.length / $scope.paging.maxPerPage);
                });
            });
        }

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

        //var state = $state.$current.name.substring(5).split('.');
        //if (state.length > 0 && state[1] == "table")
        //    $scope.state = state[0] + '.viewer';

        //function n() {
        //    console.log(arguments);
        //    return $q.when(rData);
        //};
    }

})(angular);
