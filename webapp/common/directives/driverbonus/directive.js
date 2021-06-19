(function (angular) {
    var module = angular.module('framework.directives.UI');

    module.directive('mileageStep', mileageStep);

    mileageStep.$inject = ['$parse', '$http', '$config', '$filter'];

    function mileageStep($parse, $http, $config, $filter) {
        return {
            scope: true,
            templateUrl: '/webapp/common/directives/mileagestep/template.html',
            link: function (scope, elem, attrs) {
                var value = '[]';
                var getter = $parse(attrs.value);
                var internalChange = false;
                scope.steps = [];
                scope.$watch(function () {
                    return getter(scope)
                }, function (nv) {
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
                        angular.forEach(scope.steps, function (n) {
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

                scope.getPrevious = function (s) {
                    var index = scope.steps.indexOf(s);
                    if (index <= 0) return 0;
                    else {
                        if (scope.steps[index - 1].max >= s.max) {
                            s.max = scope.steps[index - 1].max + 1;
                        }
                        return scope.steps[index - 1].max;
                    }
                }

                scope.remove = function (s) {
                    var index = scope.steps.indexOf(s);
                    scope.steps.splice(index, 1);
                    if (scope.steps.length > 0)
                        scope.steps[scope.steps.length - 1].max = null;
                    onChange();
                }

                scope.add = function (s) {
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
})(angular);