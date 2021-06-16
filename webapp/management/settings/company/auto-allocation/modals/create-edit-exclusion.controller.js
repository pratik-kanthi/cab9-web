(function(angular) {
    var module = angular.module('cab9.settings');

    module.controller('CreateEditAllocationExclusionRuleModalController', CreateEditAllocationExclusionRuleModalController);

    CreateEditAllocationExclusionRuleModalController.$inject = ['$scope', 'rAllocationRule', 'Auth', '$http', 'Model', '$UI', '$modal'];

    function CreateEditAllocationExclusionRuleModalController($scope, rAllocationRule, Auth, $http, Model, $UI, $modal) {
        $scope.rule = rAllocationRule;
        $scope.exclusionRules = $scope.rule.exclusionRules.length != 0 ? $scope.rule.exclusionRules : [];
        $scope.ruleViewMode = 'VIEW';
        $scope.exclusionRule = new Model.BiddingExclusionRule();

        $scope.addRule = addRule;
        $scope.saveRule = saveRule;
        $scope.editRule = editRule;
        $scope.deleteRule = deleteRule;
        $scope.updateRule = updateRule;
        $scope.cancel = cancel;

        function cancel() {
            $scope.ruleViewMode = 'VIEW';
        }

        function deleteRule(rule) {
            rule.$delete().then(function() {
                swal('Success', 'Exclusion rule Deleted', 'success');
                var index = $scope.exclusionRules.indexOf(rule);
                $scope.exclusionRules.splice(index, 1);
                location.reload();
            });
        }

        function addRule() {
            $scope.ruleViewMode = 'CREATE';
            $scope.week = [{
                day: "Mo",
                value: 2,
                selected: false,
                full: "Monday"
            }, {
                day: "Tu",
                value: 4,
                selected: false,
                full: "Tuesday"
            }, {
                day: "We",
                value: 8,
                selected: false,
                full: "Wednesday"
            }, {
                day: "Th",
                value: 16,
                selected: false,
                full: "Thursday"
            }, {
                day: "Fr",
                value: 32,
                selected: false,
                full: "Friday"
            }, {
                day: "Sa",
                value: 64,
                selected: false,
                full: "Saturday"
            }, {
                day: "Su",
                value: 1,
                selected: false,
                full: "Sunday"
            }];
        }

        function editRule(item) {
            $scope.ruleViewMode = 'EDIT';
            $scope.exclusionRule = item;
            debugger;
            if ($scope.exclusionRule.StartTime) {
                $scope.exclusionRule.$startTime = moment.utc().startOf('day').add($scope.exclusionRule.StartTime, 'minutes').toDate();
            }

            if ($scope.exclusionRule.EndTime) {
                $scope.exclusionRule.$endTime = moment.utc().startOf('day').add($scope.exclusionRule.EndTime, 'minutes').toDate();
            }

            $scope.week = [{
                    day: "Mo",
                    value: 2,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Monday') != -1,
                    full: "Monday"
                }, {
                    day: "Tu",
                    value: 4,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Tuesday') != -1,
                    full: "Tuesday"
                }, {
                    day: "We",
                    value: 8,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Wednesday') != -1,
                    full: "Wednesday"
                }, {
                    day: "Th",
                    value: 16,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Thursday') != -1,
                    full: "Thursday"
                }, {
                    day: "Fr",
                    value: 32,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Friday') != -1,
                    full: "Friday"
                }, {
                    day: "Sa",
                    value: 64,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Saturday') != -1,
                    full: "Saturday"
                },
                {
                    day: "Su",
                    value: 1,
                    selected: $scope.exclusionRule.DaysOfWeek && $scope.exclusionRule.DaysOfWeek.indexOf('Sunday') != -1,
                    full: "Sunday"
                }
            ];
        }

        function saveRule() {
            if ($scope.week.filter(function(day) {
                return day.selected == true
            }).length > 0) {
                $scope.exclusionRule.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                    if (day.selected) {
                        return prev + day.value;
                    } else {
                        return prev;
                    }
                }, 0);
            } else {
                $scope.exclusionRule.DaysOfWeek = null;
            }

            if ($scope.exclusionRule.$startTime && $scope.exclusionRule.$endTime) {
                var start = moment.utc($scope.exclusionRule.$startTime);
                var end = moment.utc($scope.exclusionRule.$endTime);

                $scope.exclusionRule.StartTime = 0 + (start.hours() * 60)  + start.minutes();
                $scope.exclusionRule.EndTime = 0 + (end.hours() * 60)  + end.minutes();

                if ($scope.exclusionRule.EndTime === 0) {
                    $scope.exclusionRule.EndTime = 1440;
                }

                if($scope.exclusionRule.EndTime < $scope.exclusionRule.StartTime) {
                    $scope.exclusionRule.EndTime = $scope.exclusionRule.EndTime + 1440;
                }
            }
            debugger;

            $scope.exclusionRule.AutoAllocationRuleId = $scope.rule.Id;

            $scope.exclusionRule.$save().then(function(d) {
                swal('Success', 'Exclusion Rule Saved', 'success');
                $scope.ruleViewMode = 'VIEW';
                location.reload();
            });
        }

        function updateRule() {
            if ($scope.week.filter(function(day) {
                return day.selected == true
            }).length > 0) {
                $scope.exclusionRule.DaysOfWeek = $scope.week.reduce(function(prev, day) {
                    if (day.selected) {
                        return prev + day.value;
                    } else {
                        return prev;
                    }
                }, 0);
            } else {
                $scope.exclusionRule.DaysOfWeek = null;
            }

            if ($scope.exclusionRule.$startTime && $scope.exclusionRule.$endTime) {
                var start = moment.utc($scope.exclusionRule.$startTime);
                var end = moment.utc($scope.exclusionRule.$endTime);

                $scope.exclusionRule.StartTime = 0 + (start.hours() * 60)  + start.minutes();
                $scope.exclusionRule.EndTime = 0 + (end.hours() * 60)  + end.minutes();

                if ($scope.exclusionRule.EndTime === 0) {
                    $scope.exclusionRule.EndTime = 1440;
                }

                if($scope.exclusionRule.EndTime < $scope.exclusionRule.StartTime) {
                    $scope.exclusionRule.EndTime = $scope.exclusionRule.EndTime + 1440;
                }
            }

            $scope.exclusionRule.$save().then(function(d) {
                swal('Success', 'Exclusion Rule Updated', 'success');
                $scope.ruleViewMode = 'VIEW';
                location.reload();
            });
        }


        
    }
}(angular))
