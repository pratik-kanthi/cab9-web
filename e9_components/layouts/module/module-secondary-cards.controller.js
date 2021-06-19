(function(angular) {
    var module = angular.module('framework.UI.module');

    module.controller('ModuleSecondaryCardsController', moduleSecondaryCardsController);

    moduleSecondaryCardsController.$inject = ['$scope', 'rData', 'rNavTo', 'rAccessors', '$state', '$interval', '$timeout', 'rId', '$filter'];

    function moduleSecondaryCardsController($scope, rData, rNavTo, rAccessors, $state, $interval, $timeout, rId, $filter) {
        $scope.rawItems = rData;
        $scope.filteredItems = [];
        $scope.accessors = rAccessors;
        $scope.rNavTo = rNavTo;
        $scope.rId = rId;
        $scope.toggleScore = toggleScore;
        $scope.choosen = {
            group: null
        };
        $scope.cardLimit = 2;
        $scope.showScore = false;

        $scope.groups = {};
        rData = rData.sort(function(a, b) {
            var valA = rAccessors.Title(a),
                valB = rAccessors.Title(b);
            if (valA < valB) {
                return -1;
            } else if (valA > valB) {
                return 1;
            } else
                return 0;
        });
        if (rAccessors.Group) {
            var i, groupCount = 0;
            for (i = 0; i < rData.length; i++) {
                var title = rAccessors.Group(rData[i]);
                if ($scope.groups[title])
                    $scope.groups[title].push(rData[i]);
                else {
                    $scope.groups[title] = [rData[i]];
                    groupCount++;
                }
            }

            if ($scope.groups.hasOwnProperty('true') || $scope.groups.hasOwnProperty('false')) {
                modifyGroupsForStatus();
                $scope.choosen.group = 'true';
            }

            $scope.selectGroups = groupCount > 5;
        }

        function toggleScore() {
            $scope.showScore = !$scope.showScore;
        }

        if (rData.pullMore) {
            rData.pullMore.execute().then(function(data) {
                $scope.rawItems = data;
                $scope.groups = {};
                data = data.sort(function(a, b) {
                    var valA = rAccessors.Title(a),
                        valB = rAccessors.Title(b);
                    if (valA < valB) {
                        return -1;
                    } else if (valA > valB) {
                        return 1;
                    } else
                        return 0;
                });
                if (rAccessors.Group) {
                    var i, groupCount = 0;
                    for (i = 0; i < data.length; i++) {
                        var title = rAccessors.Group(data[i]);
                        if ($scope.groups[title])
                            $scope.groups[title].push(data[i]);
                        else {
                            $scope.groups[title] = [data[i]];
                            groupCount++;
                        }
                    }
                    if ($scope.groups.hasOwnProperty('true') || $scope.groups.hasOwnProperty('false'))
                        modifyGroupsForStatus();

                    $scope.selectGroups = groupCount > 5;
                }
            });

        }

        function modifyGroupsForStatus() {
            var _groups = {
                'true': [],
                'false': []
            };
            if ($scope.groups['true'] && $scope.groups['true'].length > 0)
                _groups.true = $scope.groups['true'];

            if ($scope.groups['false'] && $scope.groups['false'].length > 0)
                _groups.false = $scope.groups['false'];

            $scope.groups = _groups;
        }

        $timeout(function() {
            $scope.showSearch = true;
            setTimeout(function() { $('#searchTerm').focus() }, 500);
        }, 500);

        $scope.$watchGroup(['searchTerm.$', 'choosen.group', 'rawItems.length'], function() {
            var textFiltered = $filter('filter')($scope.rawItems, $scope.searchTerm);
            if ($scope.choosen.group) {
                $scope.filteredItems = textFiltered.filter(function(i) {
                    return rAccessors.Group(i) == $scope.choosen.group;
                });
            } else {
                $scope.filteredItems = textFiltered;
            }
        });

    }

})(angular);