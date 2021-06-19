(function() {
    var module = angular.module('cab9.widgets');

    module.directive('twitter', ['$UI', '$config', '$http', '$q', '$filter', '$timeout',
        function($UI, $config, $http, $q, $filter, $timeout) {
            return {
                templateUrl: '/webapp/common/widgets/twitter.tmpl.html',
                scope: {
                    filters: '=',
                    height: '='
                },
                link: function(scope, element, attrs) {
                }
            };
        }
    ]);
}());
