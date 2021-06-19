(function(angular) {
    var module = angular.module('framework.services.data');

    module.directive('tableFor', tableForDirective);
    module.directive('tableTitlebar', tableTitlebarDirective);
    module.directive('tableHeading', tableHeadingDirective);
    module.directive('tableDataRows', tableDataRowsDirective);
    module.directive('tableFooter', tableFooterDirective);
    module.filter('publish', publishFilter);
    module.filter('softFilter', softFilter);
    module.filter('pageGroup', pageGroupFilter);
    module.filter('normalise', normaliseText);



    tableForDirective.$inject = ['$parse', 'Model', '$modal', '$q', '$filter', '$timeout', 'CSV'];

    function tableForDirective($parse, Model, $modal, $q, $filter, $timeout, CSV) {
        var defaults = {
            wrapperClass: 'table-responsive',
            tableClass: 'table table-bordered',
            minWidth: '600px'
        }

        function linkFn(scope, element, attrs, ctrls, transcludeFn) {
            var externalSearch = $parse(attrs.filtering)(scope);
            var externalSorting = $parse(attrs.sorting)(scope);
            var externalGrouping = $parse(attrs.grouping)(scope);
            var externalPaging = $parse(attrs.paging)(scope);
            var externalColumns = ($parse(attrs.config)(scope) || {});
            var restrictColumns = $parse(attrs.columns)(scope);

            scope.$schema = Model[attrs.schema].$schema;
            scope.$table = {
                actionColumn: false,
                selectionColumn: false,
                cardTemplate: '{{$row | json}}',
                toggleSelectAll: toggleSelectAll,
                toggleRowSelection: toggleRowSelection,
                toggleGroupSelection: toggleGroupSelection,
                allSelected: false,
                reset: reset,
                configureColumns: configureColumns,
                sort: sort,
                getSortingClass: getSortingClass,
                export: exportData
            };
            scope.$columns = generateColumns(scope.$schema);
            scope.$filtering = externalSearch || {
                $: ''
            }
            scope.$sorting = externalSorting || [];
            scope.$grouping = externalGrouping || {
                value: undefined
            };
            scope.$paging = externalPaging || {
                currentPage: 1,
                totalItems: 0,
                maxPerPage: 10
            };
            scope.$data = {}; //object as it's grouped
            scope.$datasource = function() {
                return $q.when([]); //returns existing data by default;
            };

            var datasource = $parse(attrs.datasource)(scope);
            if (!datasource) {
                scope.$datasource = function() {
                    return $q.when([]); //returns existing data by default;
                };
            } else if (angular.isArray(datasource)) {
                scope.$datasource = generateLocalDatasource(datasource);
            } else if (angular.isFunction(datasource)) {
                scope.$datasource = datasource;
            } else {
                scope.$datasource = generateModelDatasource(datasource);
            }

            scope.$watch(function() {
                return $parse(attrs.datasource)(scope);
            }, function(datasource) {
                if (!datasource) {
                    scope.$datasource = function() {
                        return $q.when([]); //returns existing data by default;
                    };
                } else if (angular.isArray(datasource)) {
                    scope.$datasource = generateLocalDatasource(datasource);
                } else if (angular.isFunction(datasource)) {
                    scope.$datasource = datasource;
                } else {
                    scope.$datasource = generateModelDatasource(datasource);
                }
                debouncedUpdateData();
            });
            scope.$watchCollection(function() {
                return scope.$filtering;
            }, debouncedUpdateData);
            scope.$watchCollection(function() {
                return scope.$sorting;
            }, debouncedUpdateData);
            scope.$watchCollection(function() {
                return scope.$grouping;
            }, debouncedUpdateData);
            scope.$watch(function() {
                return scope.$paging.currentPage;
            }, debouncedUpdateData);
            scope.$watch(function() {
                return scope.$paging.maxPerPage;
            }, debouncedUpdateData);
            //added
            scope.$watch(function() {
                return scope.$columns;
            }, debouncedUpdateData, true);

            var updateDebounce = null;

            function debouncedUpdateData() {
                if (updateDebounce) {
                    $timeout.cancel(updateDebounce);
                    updateDebounce = null;
                }
                updateDebounce = $timeout(updateData, 500);
            }

            function updateData() {
                for (var key in scope.$data) {
                    delete scope.$data[key];
                }
                scope.$data.$loading = true;
                scope.$data.$error = null;
                scope.$datasource(scope.$filtering, scope.$sorting, scope.$grouping, scope.$paging, scope.$data).then(dataReceived, dataError, dataNotified);
            }

            function dataReceived(data) {
                for (var key in scope.$data) {
                    delete scope.$data[key];
                }
                scope.$data.$loading = false;
                angular.extend(scope.$data, data);
            }

            function dataError(error) {
                for (var key in scope.$data) {
                    delete scope.$data[key];
                }
                scope.$data.$loading = false;
                scope.$data.$error = error;
            }

            function dataNotified(dataLength) {
                scope.$paging.totalItems = dataLength;
            }

            transcludeFn(scope, function(clone, scope) {
                element.find('table').append(clone);
            });

            function exportData(event, type, selectedOnly) {
                scope.$datasource(scope.$filtering, scope.$sorting, scope.$grouping, {
                    currentPage: 1,
                    maxPerPage: null
                }, []).then(function(grouped) {
                    var rawData = [];
                    angular.forEach(grouped, function(values) {
                        [].push.apply(rawData, values);
                    });
                    var data = [];
                    //added
                    if (selectedOnly) {
                        var rawData = rawData.filter(function(row) {
                            return selectedRows.indexOf(row.Id) > -1;
                        });
                    }
                    angular.forEach(rawData, function(row) {
                        var finalRow = {};
                        angular.forEach(scope.$columns, function(col) {
                            if (col.visible) {
                                finalRow[col.title] = col.accessor(row);
                            }
                        });
                        data.push(finalRow);
                    });

                    var filename = "data";

                    if (type == "csv") {
                        CSV.download(data, filename);
                    } else if (type == "json") {
                        var formatted = $filter('json')(data, true);
                        var a = document.createElement('a');
                        a.href = 'data:application/json,' + encodeURIComponent(formatted);
                        a.target = '_blank';
                        a.download = filename + '.json';
                        a.style.display = 'none';
                        document.body.appendChild(a);
                        a.click();
                    }
                })
            }

            function generateLocalDatasource(initialData) {
                var data = initialData;
                return function(filtering, sorting, grouping, paging, existing) {
                    var deferred = $q.defer();

                    setTimeout(function() {
                        var filter = $filter('filter');
                        var orderBy = $filter('orderBy');
                        var groupBy = $filter('groupBy');
                        var pageGroup = $filter('pageGroup');

                        var filtered = filter(data, filtering);
                        var ordered = filtered;
                        deferred.notify(filtered.length);

                        var amendedSorting = [];
                        if (grouping.value) {
                            amendedSorting.push(grouping.value);
                        }
                        [].push.apply(amendedSorting, sorting);


                        if (amendedSorting.length > 0) {
                            ordered = orderBy(filtered, amendedSorting);
                        }

                        var result = pageGroup(groupBy(ordered, grouping.value), paging);

                        deferred.resolve(result);
                    }, 0);

                    return deferred.promise;
                }
            }

            function generateModelDatasource(modelQuery) {
                var queryBase = modelQuery;
                return function(filtering, sorting, grouping, paging, existing) {
                    var deferred = $q.defer();
                    var query = queryBase.clone();
                    var filter = $filter('filter');
                    var orderBy = $filter('orderBy');
                    var groupBy = $filter('groupBy');
                    var pageGroup = $filter('pageGroup');

                    // added 
                    //fetch columns for whom visible is set to true
                    var amendSelection = ['Id'];
                    for (var i = 0; i < scope.$columns.length; i++) {
                        if (scope.$columns[i].visible) {
                            if (scope.$columns[i].reqColumns)
                                amendSelection.push.apply(amendSelection, scope.$columns[i].reqColumns);
                            else
                                amendSelection.push(scope.$columns[i].key);
                        }
                    }
                    query.select(amendSelection.toString());


                    var amendedSorting = [];

                    if (grouping.value) {
                        amendedSorting.push(grouping.value);
                    }
                    [].push.apply(amendedSorting, sorting);
                    for (var i = 0; i < amendedSorting.length; i++) {
                        var item = amendedSorting[i];
                        if (item[0] == '-') {
                            item = item.substring(1) + ' desc';
                        }
                        query.orderBy(item);
                    }

                    //query.filter(filtering);

                    query.page(paging.currentPage, paging.maxPerPage); //TODO;

                    query.execute().then(function(data) {
                        //added
                        scope.$table.allSelected = false;
                        if (selectedRows.length > 0) {
                            data = data.map(function(row) {
                                if (selectedRows.indexOf(row.Id) > -1) {
                                    row.$selected = true;
                                }
                                return row;
                            });
                        }

                        //added
                        var _angularSorting = amendedSorting.map(function(item) {
                            item = item.replace(/\//g, '.');
                            return item;
                        });

                        var result;
                        var ordered = orderBy(filter(data, filtering), _angularSorting);
                        if (grouping.value) {
                            result = groupBy(ordered, grouping.value);
                        } else {
                            result = {
                                'undefined': ordered
                            };
                        }
                        deferred.resolve(result);
                    });

                    return deferred.promise;
                }
            }

            function generateColumns(modelSchema) {
                var columns = [];
                if (restrictColumns) {
                    angular.forEach(restrictColumns, function(value) {
                        var key = "";
                        var sConfig = null;
                        var eConfig = { visible: true };
                        if (angular.isObject(value)) {
                            key = value.key
                            eConfig = angular.extend(eConfig, value);
                        } else {
                            key = value;
                        }
                        if (key[0] == '-') {
                            key = value.key.substring(1);
                            eConfig.visible = false;
                        }
                        var widthIndex = key.indexOf(':');
                        if (widthIndex != -1) {
                            eConfig.width = key.substring(widthIndex + 1);
                            key = key.substring(0, widthIndex);
                        }
                        eConfig.hidden = false;
                        sConfig = modelSchema[key];

                        if (sConfig != null) {
                            var config = angular.extend({}, sConfig, sConfig.table || {}, externalColumns[key] || {}, eConfig);
                            if (config.hidden) {
                                return;
                            }
                            if (!angular.isDefined(config.visible)) {
                                config.visible = true;
                            }
                            if (!angular.isDefined(config.binding) && config.type === moment) {
                                config.binding = new Function('row', 'return new moment(row.' + key + ').format("' + (config.format || 'DD/MM/YYYY HH:mm HH:mm') + '");');
                            }
                            columns.push({
                                key: key,
                                config: config,
                                title: config.display || key,
                                accessor: angular.isFunction(config.binding) ? config.binding : buildAccessor(config.binding || key),
                                htmlBinding: config.htmlBinding,
                                binding: config.binding || key,
                                visible: config.visible,
                                filters: config.filters,
                                reqColumns: config.reqColumns, // added
                                sort: config.sort // added
                            });
                        }
                    });
                } else {
                    angular.forEach(modelSchema, function(value, key) {
                        if (restrictColumns && (restrictColumns.indexOf(key) == -1 || restrictColumns.indexOf('-' + key) == -1)) {
                            return;
                        }

                        var config = angular.extend({}, value, value.table || {}, externalColumns[key] || {});
                        if (config.hidden) {
                            return;
                        }
                        if (!angular.isDefined(config.visible)) {
                            config.visible = true;
                        }
                        if (!angular.isDefined(config.binding) && config.type === moment) {
                            config.binding = new Function('row', 'return row.' + key + '?new moment(row.' + key + ').format("' + (config.format || 'DD/MM/YYYY HH:mm') + '"):"";');
                            //if (!angular.isDefined(config.filters)) {
                            //  config.filters = " | date:'dd/MM/yyyy'";
                            //}
                        }
                        //if (!angular.isDefined(config.binding) && angular.isDefined(config.currency) && config.currency) {
                        //    config.binding = new Function('row', 'return row.' + key );
                        //}
                        columns.push({
                            key: key,
                            config: config,
                            title: config.display || key,
                            accessor: angular.isFunction(config.binding) ? config.binding : buildAccessor(config.binding || key),
                            htmlBinding: config.htmlBinding,
                            binding: config.binding || key,
                            visible: config.visible,
                            filters: config.filters,
                            reqColumns: config.reqColumns, // added
                            sort: config.sort // added
                        });
                    });
                }
                return columns; //$filter('orderBy')(columns, 'config.priority');
            }

            var selectedRows = [];

            function toggleSelectAll() {
                scope.$table.allSelected = !scope.$table.allSelected;
                angular.forEach(scope.$data, function(group) {
                    toggleGroupSelection(group, scope.$table.allSelected);
                });
            }

            function toggleRowSelection(group, row, force) {
                row.$selected = angular.isDefined(force) ? force : !row.$selected;
                var selected = group.filter(function(d) {
                    return d.$selected;
                });

                //added
                var index = selectedRows.indexOf(row.Id);
                if (index > -1 && !row.$selected)
                    selectedRows.splice(index, 1);
                else if (index == -1 && row.$selected)
                    selectedRows.push(row.Id);

                group.$selected = selected.length === group.length;

                var groups = 0;
                var selectedGroups = 0;
                angular.forEach(scope.$data, function(group, title) {
                    if (title[0] == '$') {
                        return;
                    }
                    groups++;
                    if (group.$selected) selectedGroups++;
                });
                scope.$table.allSelected = groups === selectedGroups;
            }

            function toggleGroupSelection(group, force) {
                if (angular.isDefined(force)) {
                    group.$selected = force;
                } else {
                    group.$selected = !group.$selected;
                }
                angular.forEach(group, function(row) {
                    row.$selected = group.$selected;
                    // added
                    var index = selectedRows.indexOf(row.Id);
                    if (index > -1 && !row.$selected)
                        selectedRows.splice(index, 1);
                    else if (index == -1 && row.$selected)
                        selectedRows.push(row.Id);
                });

                if (!angular.isDefined(force)) {
                    var groups = 0;
                    var selectedGroups = 0;
                    angular.forEach(scope.$data, function(group, title) {
                        if (title[0] == '$') {
                            return;
                        }
                        groups++;
                        if (group.$selected) selectedGroups++;
                    });
                    scope.$table.allSelected = groups === selectedGroups;
                }
            }

            function setAreAllSelected() {
                scope.$table.allSelected = false;
            }

            function sort(column) {
                //multisort
                // added
                if (column.sort) {
                    if (column.sort.length > 5)
                        column.sort.splice(5, column.sort.length - 5);

                    if (column.sort.length !== scope.$sorting.length) {
                        scope.$sorting.length = 0;
                        scope.$sorting = angular.copy(column.sort);
                        return;
                    }
                    var count = 0;
                    var existing = angular.copy(scope.$sorting);

                    for (var i = 0; i < column.sort.length; i++) {
                        if (column.sort[i] == existing[i]) {
                            existing[i] = '-' + column.sort[i];
                            count++;
                        } else if ('-' + column.sort[i] == existing[i]) {
                            existing[i] = column.sort[i];
                            count--;
                        }
                    }
                    if (count == column.sort.length || count == -Math.abs(column.sort.length)) {
                        scope.$sorting.length = 0;
                        scope.$sorting = existing;
                    } else {
                        scope.$sorting.length = 0;
                        scope.$sorting = column.sort;
                    }
                } else {
                    col = column.key;
                    var currentSort = scope.$sorting[0];
                    if (col == currentSort) {
                        scope.$sorting[0] = '-' + col;
                    } else if ('-' + col == currentSort) {
                        scope.$sorting[0] = col;
                    } else {
                        scope.$sorting.length = 0;
                        scope.$sorting.push(col);
                    }
                }
            }

            function getSortingClass(column) {
                // added
                if (column.sort) {
                    if (column.sort.length > 5)
                        column.sort.splice(5, column.sort.length - 5);

                    if (column.sort.length !== scope.$sorting.length) {
                        return 'fa fa-sort fa-lg';
                    }
                    var count = 0;
                    for (var i = 0; i < column.sort.length; i++) {
                        if (column.sort[i] == scope.$sorting[i]) {
                            count++;
                        } else if ('-' + column.sort[i] == scope.$sorting[i]) {
                            count--;
                        }
                    }
                    if (count == column.sort.length)
                        return 'fa fa-sort-asc fa-lg brand-primary';
                    else if (count == -Math.abs(column.sort.length))
                        return 'fa fa-sort-desc fa-lg brand-primary';
                    else
                        return 'fa fa-sort fa-lg';
                } else {
                    col = column.key;
                    if (col == scope.$sorting[0]) {
                        return 'fa fa-sort-asc fa-lg brand-primary';
                    } else if ('-' + col == scope.$sorting[0]) {
                        return 'fa fa-sort-desc fa-lg brand-primary';
                    } else {
                        return 'fa fa-sort fa-lg';
                    }
                }
            }

            function reset() {
                scope.$filtering = externalSearch || {
                    $: ''
                }
                scope.$sorting = [];

                //TODO: Deselect ALL
                //added
                selectedRows = [];
                scope.$table.allSelected = false;
                angular.forEach(scope.$data, function(group) {
                    angular.forEach(group, function(row) {
                        row.$selected = false;
                    });
                });

                scope.$columns.length = 0;
                [].push.apply(scope.$columns, generateColumns(scope.$schema));
            }

            function buildAccessor(fieldName, date) {
                if (date) {
                    return new Function('row', 'return new moment(row.' + fieldName + ').format(' + date + ');');
                } else {
                    return new Function('row', 'return row.' + fieldName + ';');
                }
            }

            function configureColumns() {
                $modal.open({
                    template: '' +
                        '<div class="modal-header">' +
                        '<button class="close" type="button" ng-click="$dismiss()"><i class="material-icons">clear</i></button>' + //added ng-click="$close(columns)"
                        '<h3 class="modal-title">Customize Columns</h3>' +
                        '</div>' +
                        '<div class="modal-body">' +
                        '<p class="text-muted">Select and drag the columns to adjust the order of the columns.</p>' +
                        '<div ui-sortable ng-model="columns">' +
                        '<div ng-repeat="column in columns">' +
                        // '<a ng-click="moveUp(column)" ng-hide="$first"><i class="icon-Arrow-UpinCircle brand-primary"></i></a>' +
                        '{{column.title}}' +
                        // ' &nbsp; <a ng-click="moveDown(column)" ng-hide="$last"><i class="icon-Arrow-DowninCircle brand-primary"></i></a>' +
                        '<div class="checkbox pull-right m0">' +
                        '<input type="checkbox" id="columncustomise{{::$index}}" ng-model="column.visible" ng-checked="column.visible" />' +
                        '<label for="columncustomise{{::$index}}"></label>' +
                        '</div><br class="clearfix">' +
                        '</div>' +
                        '</div>' +
                        '</div>' +
                        '<div class="modal-footer"><button class="btn btn-xs btn-success" ng-click="$close(columns)"><i class="material-icons">save</i>Save</button></div>',
                    controller: ['$scope', 'columns', function($scope, columns) {
                        // $scope.columns = columns;
                        // added
                        $scope.columns = angular.copy(columns);
                        $scope.moveUp = function(column) {
                            var index = $scope.columns.indexOf(column);
                            move(index, index - 1);
                        }
                        $scope.moveDown = function(column) {
                            var index = $scope.columns.indexOf(column);
                            move(index, index + 1);
                        }

                        function move(old_index, new_index) {
                            $scope.columns.splice(new_index, 0, $scope.columns.splice(old_index, 1)[0]);
                        }
                    }],
                    size: 'sm',
                    windowClass: 'column-configure-modal',
                    resolve: {
                        columns: function() {
                            return scope.$columns
                        }
                    }
                }).result.then(function(result) { //added
                    scope.$columns = result;
                });
            }
        }

        function compileFn(element, attrs) {
            return linkFn;
        }

        return {
            scope: true,
            transclude: true,
            template: function(element, attrs) {
                return '<div class="' + (attrs.wrapperClass || defaults.wrapperClass) + '"><div class="shadow" ng-show="$data.$loading"><img src="/includes/images/preloader-fading.gif" /></div><table class="' + (attrs.tableClass || defaults.tableClass) + ' module-table" style="width:100%;min-width:' + (attrs.minWidth || defaults.minWidth) + '"></table></div>'
            },
            compile: function(element, attrs) {
                return linkFn;
            }
        };
    }

    function tableTitlebarDirective() {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            template: function(element, attrs) {
                var template = '' +
                    '<thead><tr><th colspan="100" class="table-arrange">';
                if (attrs.title) {
                    template += '<h3 class="table-title">' + attrs.title + '</h3>';
                }
                if (attrs.showCount) {
                    template += '<h3 class="table-title brand-primary">({{$visible.length}} / {{ $data.length }})</h3>';
                }
                if (attrs.columnsOptions || attrs.exportOptions) {
                    template += '<div class="columns-options">';
                }
                if (attrs.columnsOptions) {
                    template += '<a href="" ng-click="$table.reset()"><i class="material-icons">settings_backup_restore</i> Reset</a>' +
                        '<a href="" ng-click="$table.configureColumns()"><i class="material-icons">sort</i> Arrange</a>';
                }

                if (attrs.exportOptions) {
                    template += '<span class="dropdown" dropdown>' +
                        '<a href="" class="dropdown-toggle" dropdown-toggle><i class="material-icons">receipt</i> Export</a>' +
                        '<ul class="dropdown-menu">' +
                        '<li><a href ng-click="$table.export($event, \'csv\', false)" style="float:none !important;margin:0;">Csv (ALL)</a></li>' +
                        '<li><a href ng-click="$table.export($event, \'json\', false)" style="float:none !important;margin:0;">Json (ALL)</a></li>' +
                        '<li><a href ng-click="$table.export($event, \'csv\', true)" style="float:none !important;margin:0;">Csv (SELECTED)</a></li>' +
                        '<li><a href ng-click="$table.export($event, \'json\', true)" style="float:none !important;margin:0;">Json (SELECTED)</a></li>' +
                        '</ul>' +
                        '</span>'
                }

                if (attrs.columnsOptions || attrs.exportOptions) {
                    template += '</div>';
                }

                if (attrs.paging == true) {
                    template += '<div class="pull-right pagination-wrapper" ng-hide="($paging.totalItems / $paging.maxPerPage) <= 1">' +
                    '<pagination class="pagination-sm"  style="margin: 0;" total-items="$paging.totalItems" ng-model="$paging.currentPage" items-per-page="$paging.maxPerPage" boundary-links="true" max-size="3" first-text="&laquo;" previous-text="&lsaquo;" next-text="&rsaquo;" last-text="&raquo;"></pagination>' +
                    '</div>';
                }
                if (attrs.search) {
                    template += '<input type="text" class="form-control pull-right" style="width:300px" placeholder="Search.." ng-model="$filtering.$" />';
                }
                template += '</th></tr></thead>'
                return template;
            }
        }
    }

    function tableHeadingDirective() {
        var defaults = {}
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            template: function(element, attrs) {
                var tmpl = '' +
                    '<thead><tr>' +
                    '<th ng-if="::$table.selectionColumn" style="width:40px;text-align:center;">' +
                    '<div class="checkbox"><input type="checkbox" id="table-group-check" ng-click="$table.toggleSelectAll()" ng-checked="$table.allSelected"/><label for="table-group-check"></label></div>' +
                    '</th>' +
                    '<th ng-if="::$table.actionColumn" class="action-column mobile">' +
                    'Actions' +
                    '</th>' +
                    '<th ng-repeat="$column in $columns | filter: { visible: true }" class="module-table-head" ng-class="$column.config.headingClass" ng-style="{ \'width\': ($column.config.width || \'auto\') }">' +
                    '<div><i ng-class="$column.icon"></i> {{ ::$column.title | normalise }}' +
                    '<span class="table-sort"><a href="" ng-click="$table.sort($column)"><i ng-class="$table.getSortingClass($column)"></i></a></span>' + //added ng-click="$table.sort($column)" instead of ng-click="$table.sort($column.key)"
                    '</div>' + //add filter and search menu
                    '</th>' +
                    '<th ng-if="::$table.actionColumn" class="action-column">' +
                    'Actions' +
                    '</th>' +
                    '</tr>';
                tmpl += '</thead>';
                return tmpl;
            }
        };
    }

    tableDataRowsDirective.$inject = ['$parse', 'Model'];

    function tableDataRowsDirective($parse, Model) {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            template: function(element, attrs) {
                var tmp = '' +
                    '<tbody ng-repeat="(title, group) in $data track by title">' +
                    '<tr ng-show="group.length == 0"><td col="100" class="text-center bold" style="background:none;">No Data</td></tr>' +
                    '<tr ng-hide="title == \'undefined\'">' +
                    '<td ng-if="::$table.selectionColumn" style="width:40px;text-align:center;">' +
                    '<div class="checkbox"><input id="group-check-{{::title}}" type="checkbox" ng-click="$table.toggleGroupSelection(group)" ng-checked="group.$selected"/><label for="group-check-{{::title}}"></label></div>' +
                    '</td>' +
                    '<td colspan="1000"><b><u>{{ title }}</u></b></td>' +
                    '</tr>' +
                    '<tr ng-repeat-start="$row in group track by $row.Id" ng-class="$row.$selected?\'active\':\'\'">' +
                    '<td ng-if="::$table.selectionColumn" style="width:40px;text-align:center;">' +
                    '<div class="checkbox"><input id="table-check-{{::title}}{{::$index}}" type="checkbox" ng-click="$table.toggleRowSelection(group, $row)" ng-checked="$row.$selected"/><label for="table-check-{{::title}}{{::$index}}"></label></div>' +
                    '</td>' +
                    '<td ng-if="::$table.actionColumn" class="action-column mobile" bind-html-compile="$table.actionColumn.html">' +
                    '</td>' +
                    '<td ng-repeat="$column in $columns | filter: { visible: true } track by $column.key" ng-class="$column.config.cellClass">' +
                    '<div ng-if="::!$column.htmlBinding">{{$column.accessor($row)}}</div>' +
                    '<div ng-if="::$column.htmlBinding" bind-html-compile="$column.accessor($row)"></div>' +
                    '</td>' +
                    '<td ng-if="::$table.actionColumn" class="action-column" bind-html-compile="$table.actionColumn.html">' +
                    '</td>' +
                    '</tr>' +
                    '<tr ng-repeat-end="" ng-show="$row.$$expand" ng-if="::$table.expandView">' +
                    '<td bind-html-compile="$table.expandView.html" colspan="100">' +
                    '</td>' +
                    '</tr>' +
                    '</tbody>';
                return tmp;
            },
            compile: function(element, attrs) {
                var selectionElement = _findSelectionColumn(element);
                var actionsElement = _findActionColumn(element);
                var expandElement = _findExpandView(element);

                return link;

                function link(scope, element, attrs) {
                    scope.$table.actionColumn = actionsElement;
                    scope.$table.selectionColumn = selectionElement;
                    scope.$table.getCellValue = getCellValue;
                    scope.$table.expandView = expandElement;
                    scope.$table.toggleRow = toggleRow;

                    function getCellValue(row, col) {
                        console.log('GetCellValue is depreciated for performance, please use "$column.accessor($row)" instead, functions are now precompilied;');
                        if (typeof col.binding === 'string')
                            return $parse(col.binding)(row);
                        else if (angular.isFunction(col.binding))
                            return col.binding(row, col);
                        else
                            return '';
                    }

                    function toggleRow(row) {
                        if (!attrs.autoClose || attrs.autoClose == "false") {
                            row.$$expand = !row.$$expand;
                        } else {
                            if (expanded) {
                                expanded.$$expand = false;
                            }
                            if (expanded == row) {
                                expanded = null;
                            } else {
                                expanded = row;
                                row.$$expand = !row.$$expand;
                            }
                        }
                    }
                }
            }
        }

        function _findExpandView(element) {
            var expandElement = jQuery(element.context).find('table-expand-row');
            if (expandElement.length) {
                return {
                    html: expandElement.html()
                };
            }
            return false;
        }

        function _findActionColumn(element) {
            var actionsElement = jQuery(element.context).find('table-actions');
            if (actionsElement.length) {
                return {
                    html: actionsElement.html()
                };
            }
            return false;
        }

        function _findSelectionColumn(element) {
            var selectionElement = jQuery(element.context).find('table-selection');
            if (selectionElement.length) {
                return {
                    html: selectionElement.html()
                };
            }
            return false;
        }
    }

    function tableFooterDirective() {
        return {
            restrict: 'E',
            scope: true,
            replace: true,
            template: function(element, attrs) {
                var template = '' +
                    '<tfoot><tr><th colspan="100" class="table-arrange">';
                if (attrs.title) {
                    template += '<h3 class="table-title">' + attrs.title + '</h3>';
                }
                if (attrs.showCount) {
                    template += '<b class="brand-primary">(showing {{$paging.maxPerPage}} from {{ $paging.totalItems }})</b>';
                }
                if (attrs.columnsOptions) {
                    template += '<div class="columns-options">' +
                        '<a href="" ng-click="$table.reset()"><i class="material-icons">settings_backup_restore</i>Reset</a>' +
                        '<a href="" ng-click="$table.configureColumns()"><i class="material-icons">receipt</i>Arrange</a>' +
                        '</div>';
                }
                template += '<div class="pull-right mt20 pagination-wrapper">' +
                    '<pagination class="pagination-sm"  style="margin: 0;" total-items="$paging.totalItems" ng-model="$paging.currentPage" items-per-page="$paging.maxPerPage" boundary-links="true" max-size="3" first-text="&laquo;" previous-text="&lsaquo;" next-text="&rsaquo;" last-text="&raquo;"></pagination>' +
                    '</div>';
                if (attrs.search) {
                    template += '<input type="text" class="form-control pull-right" style="width:300px" placeholder="Search.." ng-model="$filtering.$" />';
                }
                template += '</th></tr></tfoot>'
                return template;
            }
        }
    }

    softFilter.$inject = ['$filter'];

    function softFilter($filter) {
        return function(array, filteringConfig) {
            var filterFn = $filter('filter');
            var filtered = filterFn(array, filteringConfig);
            for (var i = 0; i < array.length; i++) {
                var target = array[i];
                if (filtered.indexOf(target) > -1) {
                    target.$filtered = true;
                } else {
                    target.$filtered = false;
                }
            }
            return array;
        }
    }

    function normaliseText() {
        return function(text) {
            return text.replace('_', ' ');
        }
    }

    function pageGroupFilter() {
        return function(groups, pagingConfig) {
            // added
            if (pagingConfig.maxPerPage == null)
                pagingConfig.maxPerPage = groups.length;

            var newGroups = {};
            var skip = (pagingConfig.currentPage - 1) * pagingConfig.maxPerPage;
            var take = pagingConfig.maxPerPage;

            if (angular.isArray(groups)) {
                newGroups.undefined = groups.slice(skip, skip + take);
            } else {
                var groupNames = [];
                for (var key in groups) {
                    if (groups.hasOwnProperty(key) && key[0] != '$') {
                        groupNames.push(key);
                    }
                }
                groupNames.sort();

                angular.forEach(groupNames, function(title) {
                    var values = groups[title];
                    if (take <= 0) {
                        return;
                    } else if (skip > values.length) {
                        skip -= values.length;
                        return;
                    } else if (skip > 0) {
                        values.splice(0, skip);
                        skip = 0;
                    }

                    if (take >= values.length) {
                        newGroups[title] = values;
                        take -= values.length;
                    } else {
                        newGroups[title] = values.slice(0, take);
                        take = 0;
                    }
                });
            }
            return newGroups;
        };
    }

    function pagingFilter() {
        return function(array, pagingConfig) {
            if (array.length > pagingConfig.minimum) {

            } else {
                return array;
            }
        }
    }

    function publishFilter() {
        return function(array, target) {
            if (angular.isArray(target)) {
                target.length = 0;
                [].push.apply(target, array);
            }
            return array;
        }
    }
})(angular);