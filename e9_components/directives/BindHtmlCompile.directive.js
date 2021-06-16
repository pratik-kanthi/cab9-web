(function (angular) {
    'use strict';

    var module = angular.module('framework.directives.utils', []);

    module.directive('bindHtmlCompile', ['$compile', bindHtmlCompile]);

    function bindHtmlCompile($compile) {
        return {
            restrict: 'A',
            link: function (scope, element, attrs) {
                scope.$watch(function () {
                    return scope.$eval(attrs.bindHtmlCompile);
                }, function (value) {
                    element.html(value);
                    $compile(element.contents())(scope);
                });
            }
        };
    }
}(angular));