(function(angular) {
    var module = angular.module('framework.UI.module');

    module.controller('ModuleNumPlateController', moduleNumPlateController);

    moduleNumPlateController.$inject = ['$scope', 'rData', 'rNavTo', 'rAccessors', '$state', '$interval', '$timeout', '$filter'];

    function moduleNumPlateController($scope, rData, rNavTo, rAccessors, $state, $interval, $timeout, $filter) {
        $scope.rawItems = rData;
        $scope.accessors = rAccessors;
        $scope.rNavTo = rNavTo;
        $scope.showScore = showScore;
        $scope.chosenGroup = null;
        $scope.cardLimit = 2;
        $scope.choosen = {
            group: null
        };

        function showScore() {
            swal("Smart Scores are Coming Soon", "They say a picture is worth a 1000 words. We say that Cab 9 Smart Scores are worth over 1000 assements a week. Yes, that's how many times Cab9 assesses the performance of your Driver, Clients, Passengers and Controllers. Cab9 compares them in the real time with each other to conclude a simple score that gives you an exact idea of how they have been performing.")
        }

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

        $scope.selectGroups = groupCount > 5;

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
                $scope.selectGroups = groupCount > 5;
            });
        }


        $timeout(function() {
            $scope.showSearch = true;
            setTimeout(function() { $('#searchTerm').focus() }, 500);
        }, 500);

        $scope.$watchGroup(['searchTerm.$', 'chosenGroup', 'rawItems.length'], function() {
            var textFiltered = $filter('filter')($scope.rawItems, $scope.searchTerm);
            if ($scope.chosenGroup) {
                $scope.filteredItems = textFiltered.filter(function(i) {
                    return rAccessors.Group(i) == $scope.chosenGroup;
                });
            } else {
                $scope.filteredItems = textFiltered;
            }
        });
    }

})(angular);
