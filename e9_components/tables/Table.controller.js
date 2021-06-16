(function (angular) {
    var module = angular.module('framework.table', []);

    var table_defaults = {
        table: 'table table-bordered'
    };

    /*
     *  Defines Table defaults and settings
     */
    module.constant("$table_config", table_defaults);

    /*
     *  Injectable Base Class for Inhertence
     *  Functions:
     *      Lays out rows / columns
     *      Sets heading title
     *      Parses cell values
     *      Column Sizing
     */
    module.service('BasicTableControllerBase', function () {
        return BasicTableControllerBase;
    });

    /*
     *  Injectable Base Class for Inhertence
     *  Functions:
     *      As Basic Table Plus:
     *      Sortable Columns
     */
    module.service('SortableTableControllerBase', function () {
        return SortableTableControllerBase;
    });

    /*
     *  Default Implementations
     */
    module.controller('BasicTableController', basicTableController);
    module.controller('SortableTableController', sortableTableController);

    //#region BaseClasses

    function BasicTableControllerBase($scope, columns, data) {
        var $injector = angular.element('*[ng-app]').injector();
        var $parse = $injector.get('$parse');

        $scope.rows = data.data;
        $scope.columns = columns;
        $scope.getValue = getValue;

        var _totalWidths = columns.reduce(function (prev, current) {
            return prev += (current.width || '*').length;
        }, 0);

        angular.forEach(columns, function (value) {
            value.$$parser = angular.isFunction(value.mapping) ? value.mapping : $parse(value.mapping || value.name);
            value.$$width = 100.00 / _totalWidths * (value.width || '*').length + '%';
        });

        function getValue(row, col) {
            return col.$$parser(row);
        }
    }

    function SortableTableControllerBase($scope, columns, data) {
        this.base = BasicTableControllerBase;
        this.base($scope, columns, data);

        $scope.currentSort = {
            value: '',
            column: null,
            reverse: false
        };
        $scope.currentSearch = searchFunction;
        $scope.sortBy = sort;
        $scope.searchTerm = null;

        function sort(column, $event) {
            var newSort = {
                value: '',
                column: null
            };

            if (angular.isObject(column)) {
                newSort.column = column;
                newSort.value = column.$$parser;
            } else if (typeof column === "string") {
                angular.forEach($scope.columns, function (colDef) {
                    if ((colDef.mapping || colDef.name) === column) {
                        newSort.column = colDef;
                    }
                });
                newSort.value = column;
            } else if (angular.isFunction(column)) {
                newSort.value = column;
                newSort.column = null;
            }

            if ($scope.currentSort.value === newSort.value) {
                $scope.currentSort.reverse = !$scope.currentSort.reverse;
            } else {
                $scope.currentSort.reverse = false;
            }

            $scope.currentSort.value = newSort.value;
            $scope.currentSort.column = newSort.column;
        };

        function searchFunction(row) {
            if (!$scope.searchTerm) {
                return true;
            }
            var found = false;
            for (var i = 0; i < columns.length; i++) {
                var column = $scope.columns[i];
                if (angular.isUndefined(column.searchable) || column.searchable) {
                    var value = column.$$parser(row);
                    if (angular.isFunction(column.comparator)) {
                        found = column.comparator(value, $scope.searchTerm);
                    } else if (typeof value === 'string') {
                        found = value.toLowerCase().indexOf($scope.searchTerm.toLowerCase()) >= 0;
                    }
                }
                if (found) {
                    break;
                }
            }
            return found;
        };
    }
    SortableTableControllerBase.prototype = BasicTableControllerBase;

    //#endregion

    //#region Default Implementations

    basicTableController.$inject = ['$scope', 'classes', 'columns', 'data'];
    function basicTableController($scope, classes, columns, data) {
        this.base = BasicTableControllerBase;
        this.base($scope, columns, data);

        $scope.classes = angular.extend({}, table_defaults, classes);
    }
    basicTableController.prototype = BasicTableControllerBase;


    sortableTableController.$inject = ['$scope', 'classes', 'columns', 'data'];
    function sortableTableController($scope, classes, columns, data) {
        this.base = SortableTableControllerBase;
        this.base($scope, columns, data);

        $scope.classes = angular.extend({}, table_defaults, classes);
    }
    sortableTableController.prototype = SortableTableControllerBase;

    //#endregion
})(angular);