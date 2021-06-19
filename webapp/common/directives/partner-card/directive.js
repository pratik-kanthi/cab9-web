(function (angular) {
    var module = angular.module('cab9.common');

    module.directive('partnerCard', partnerCard);

    partnerCard.$inject = ['$http', '$config'];

    function partnerCard($http, $config) {
        return {
            restrict: 'E',
            replace: true,
            scope: {
                status: '@',
                showActions: '@',
                partner: '='
            },
            templateUrl: '/webapp/common/directives/partner-card/template.html',
            link: function (scope) {
                scope.partner.LogoUrl = window.formatImage(scope.partner.LogoUrl, scope.partner.Name);
            }
        };
    }
})(angular);