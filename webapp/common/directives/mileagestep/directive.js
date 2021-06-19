(function(angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('mileageStep', mileageStep);
    module.directive('peakStep', peakStep);
    module.directive('peakDayStep', peakDayStep);

    mileageStep.$inject = ['$parse', '$http', '$config', '$filter'];

    function mileageStep($parse, $http, $config, $filter) {
        return {
            scope: true,
            templateUrl: '/webapp/common/directives/mileagestep/template.html',
            link: function(scope, elem, attrs) {
                var value = '[]';
                var getter = $parse(attrs.value);
                var internalChange = false;
                scope.steps = [];
                scope.$watch(function() {
                    return getter(scope)
                }, function(nv) {
                    if (internalChange) {
                        internalChange = false;
                        return;
                    }
                    scope.steps = [];
                    if (nv) {
                        try {
                            scope.steps = JSON.parse(nv);
                        } catch (e) {
                            value = '[]';
                        }
                    } else {
                        value = '[]';
                    }
                })
                scope.onChange = onChange;

                function onChange() {
                    if (scope.steps.length) {
                        var newvalue = [];
                        angular.forEach(scope.steps, function(n) {
                            newvalue.push(angular.copy(n));
                        });
                        newvalue[newvalue.length - 1].max = null;
                        value = JSON.stringify(newvalue || []);
                    } else {
                        value = "[]";
                    }
                    getter.assign(scope, value);
                    internalChange = true;
                }

                scope.getPrevious = function(s) {
                    var index = scope.steps.indexOf(s);
                    if (index <= 0) return 0;
                    else {
                        if (scope.steps[index - 1].max >= s.max) {
                            s.max = scope.steps[index - 1].max + 1;
                        }
                        return scope.steps[index - 1].max;
                    }
                }

                scope.remove = function(s) {
                    var index = scope.steps.indexOf(s);
                    scope.steps.splice(index, 1);
                    if (scope.steps.length > 0)
                        scope.steps[scope.steps.length - 1].max = null;
                    onChange();
                }

                scope.add = function(s) {
                    if (scope.steps.length > 0) {
                        scope.steps[scope.steps.length - 1].max = scope.getPrevious(scope.steps[scope.steps.length - 1]) + 1;
                        var last = angular.copy(scope.steps[scope.steps.length - 1]);
                        last.max = null;
                        scope.steps.push(last);
                    } else {
                        scope.steps.push({
                            max: 1,
                            fare: 1
                        });
                    }
                    onChange();
                }
            }
        };
    }

    peakStep.$inject = ['$parse', '$http', '$config', '$filter'];

    function peakStep($parse, $http, $config, $filter) {
        return {
            scope: true,
            templateUrl: '/webapp/common/directives/mileagestep/peakstep-template.html',
            link: function(scope, elem, attrs) {
                var value = '[]';
                var getter = $parse(attrs.value);
                var internalChange = false;
                scope.steps = [];

                scope.week = [{
                    day: "Mo",
                    value: 1,
                    selected: true
                }, {
                    day: "Tu",
                    value: 2,
                    selected: true
                }, {
                    day: "We",
                    value: 3,
                    selected: true
                }, {
                    day: "Th",
                    value: 4,
                    selected: true
                }, {
                    day: "Fr",
                    value: 5,
                    selected: true
                }, {
                    day: "Sa",
                    value: 6,
                    selected: true
                }, {
                    day: "Su",
                    value: 0,
                    selected: true
                }];

                scope.$watch(function() {
                    return getter(scope)
                }, function(nv) {
                    if (internalChange) {
                        internalChange = false;
                        return;
                    }
                    scope.steps = [];
                    if (nv) {
                        try {
                            scope.steps = JSON.parse(nv);
                            if (!nv.weekdays) {
                                nv.weekdays = [1, 2, 3, 4, 5, 6, 0];
                            }
                            scope.steps.map(function(step) {
                                step.$week = angular.copy(scope.week);
                                if (step.weekdays && step.weekdays.length > 0) {
                                    step.$week.map(function (item) {
                                        item.selected = step.weekdays.indexOf(item.value) > -1;
                                    });
                                }
                            });
                        } catch (e) {
                            value = '[]';
                        }
                    } else {
                        value = '[]';
                    }
                })
                scope.onChange = onChange;

                function onChange() {
                    if (scope.steps.length) {
                        var newvalue = [];
                        angular.forEach(scope.steps, function (n) {
                            var copy = angular.copy(n);
                            delete copy.$week;
                            newvalue.push(copy);
                        });
                        value = JSON.stringify(newvalue || []);
                    } else {
                        value = "[]";
                    }
                    getter.assign(scope, value);
                    internalChange = true;
                }

                scope.remove = function(s) {
                    var index = scope.steps.indexOf(s);
                    scope.steps.splice(index, 1);
                    onChange();
                }

                scope.toggleDay = function(day, step) {
                    if (day.selected == true) {
                        day.selected = false;
                        step.weekdays.splice(step.weekdays.indexOf(day.value), 1);
                    } else {
                        day.selected = true;
                        step.weekdays.push(day.value);
                        step.weekdays.sort(sortNumber);
                    }
                    onChange();
                }

                function sortNumber(a, b) {
                    return a - b;
                }

                scope.add = function(s) {
                    scope.steps.push({
                        weekdays: [1, 2, 3, 4, 5, 6, 0],
                        start: "00:00",
                        end: "24:00",
                        multiplier: 1,
                        $week: angular.copy(scope.week)
                    });
                    onChange();
                }
            }
        };
    }

    peakDayStep.$inject = ['$parse', '$http', '$config', '$filter'];

    function peakDayStep($parse, $http, $config, $filter) {
        return {
            scope: true,
            templateUrl: '/webapp/common/directives/mileagestep/peakdaystep-template.html',
            link: function(scope, elem, attrs) {
                var value = '[]';
                var getter = $parse(attrs.value);
                var internalChange = false;
                scope.steps = [];
                scope.hideTimes = attrs['hideTimes'];
                scope.$watch(function() {
                    return getter(scope)
                }, function(nv) {
                    if (internalChange) {
                        internalChange = false;
                        return;
                    }
                    scope.steps = [];
                    if (nv) {
                        try {
                            scope.steps = JSON.parse(nv);
                            angular.forEach(scope.steps, function(n) {
                                n.startTime = new moment(n.start).startOf('minute').toDate();
                                n.endTime = new moment(n.end).startOf('minute').toDate();
                            });
                        } catch (e) {
                            value = '[]';
                        }
                    } else {
                        value = '[]';
                    }
                })
                scope.onChange = onChange;

                function onChange() {
                    if (scope.steps.length) {
                        var newvalue = [];
                        angular.forEach(scope.steps, function(n) {
                            var time = new moment(n.startTime).startOf('minute');
                            n.startTime = n.start = new moment(n.start).startOf('minute').hour(time.hour()).minutes(time.minute()).toDate();
                            time = new moment(n.endTime).startOf('minute');
                            n.endTime = n.end = new moment(n.end).startOf('minute').hour(time.hour()).minutes(time.minute()).toDate();
                            delete n.$$from;
                            delete n.$$to;
                            delete n.$$fromTime;
                            delete n.$$toTime;
                            newvalue.push(angular.copy(n));
                        });
                        value = JSON.stringify(newvalue || []);
                    } else {
                        value = "[]";
                    }
                    getter.assign(scope, value);
                    internalChange = true;
                }

                scope.remove = function(s) {
                    var index = scope.steps.indexOf(s);
                    scope.steps.splice(index, 1);
                    onChange();
                }

                scope.add = function(s) {
                    scope.steps.push({
                        start: new Date(),
                        end: new Date(),
                        multiplier: 1,
                        withpeaks: true
                    });
                    onChange();
                }
            }
        };
    }
})(angular);