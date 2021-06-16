(function (window, angular) {
    var app = angular.module("framework.UI.breadcrumb", []);

    app.controller('BarController', barController);

    barController.$inject = ['$scope', '$state', '$modal', '$rootScope', '$timeout', 'ViewerCache'];

    function barController($scope, $state, $modal, $rootScope, $timeout, ViewerCache) {
        $scope.breadcrumbs = [];
        $scope.helpAvailable = null;
        $scope.showHelp = showHelp;
        $rootScope.reportFilters.format = $scope.DATETIME_FORMAT.replace(/[.|/|-][y|Y][y|Y]*/g, '');

        $scope.selectedPeriod = "This Week";


        $('#daterangepicker').daterangepicker({
            "autoApply": true,
            "startDate": moment().startOf('isoweek'),
            "endDate": moment().endOf('isoweek'),
            "opens": "right",
            ranges: {
                'Today': [moment().startOf("day"), moment().endOf("day")],
                'This Week': [moment().startOf('isoweek'), moment().endOf('isoweek')],
                'This Month': [moment().startOf('month'), moment().endOf('month')]
            },
            "alwaysShowCalendars": true,
        });

        $('#daterangepicker').on('apply.daterangepicker', function (ev, picker) {
            $scope.selectedPeriod = picker.chosenLabel;
            $rootScope.reportFilters.from = picker.startDate.toISOString();
            $rootScope.reportFilters.to = picker.endDate.toISOString();
            $scope.$apply();
        });


        function showHelp() {
            if ($scope.helpAvailable)
                $modal.open({
                    templateUrl: $scope.helpAvailable,
                });
        }

        var viewerReplace = null;

        $scope.showTimeControl = $state.current.showTimeControl;

        $rootScope.$on('$stateChangeSuccess', function (event, toState, toParams, fromState, fromParams) {
            viewerReplace = _getViewerReplace(toState, toParams);
            _parseStateName(toState.name);
            $scope.helpAvailable = toState.hasHelp;
            $scope.showTimeControl = toState.showTimeControl;
        });

        $scope.helpAvailable = $state.current.hasHelp;
        viewerReplace = _getViewerReplace($state.current, $state.params);
        _parseStateName($state.current.name);

        function _parseStateName(stateName) {
            var parts = stateName.split('.');
            var breadcrumbs = [];
            for (var i = 0; i < parts.length; i++) {
                var p = parts[i];
                if (p === "root" || (p === "viewer" && !viewerReplace)) {
                    continue;
                }
                var full = parts.slice(0, i + 1).join('.');
                breadcrumbs.push({
                    name: parts[i],
                    $html: _generateBreadcrumbHtml(p, full)
                });
            }
            $scope.breadcrumbs = breadcrumbs;
        }

        function _generateBreadcrumbHtml(name, state) {
            if (name == 'viewer') {
                name = viewerReplace;
                state = state + ".dashboard";
            }
            var s = $state.get(state);
            var template = '<a ui-sref="' + (s.default || state) + '" ui-sref-opts="{reload: true}" >' + name + '</a>';
            return template;
        }

        function _getViewerReplace(state, params) {
            if (state.viewerType) {
                var c = ViewerCache[state.viewerType];
                if (c) {
                    var found = c.filter(function (i) {
                        return i.Id === params.Id;
                    })[0];
                    if (found) {
                        return found.Name;
                    }
                }
            }
            return null;
        }
    };
})(window, angular);