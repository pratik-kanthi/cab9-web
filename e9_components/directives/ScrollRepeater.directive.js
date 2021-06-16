(function (angular) {
    //    'use strict';
    var module = angular.module('framework.directives.UI');
    module.directive('scrollPosition', ScrollPosition)
    ScrollPosition.$inject = ['$window'];

    function ScrollPosition($window) {
        return function (scope, element, attrs) {
            var w = element[0];
            angular.element(w).bind('scroll', function () {
                scope.$apply(function () {
                    if (w.scrollTop + w.offsetHeight >= w.scrollHeight)
                        scope.displayLimit = scope.displayLimit + 10;
                });
            });
        }
    };
}(angular));