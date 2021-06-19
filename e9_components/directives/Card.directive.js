(function(angular) {
    //ui-sref="{{ rNavTo + '({ Id: \'' + item.Id + '\' })'}}"

    var module = angular.module('framework.directives.UI', []);

    module.directive('card', cardDirective);
    cardDirective.$inject = ['$state', '$interval', '$parse'];

    function cardDirective($state, $interval, $parse) {
        return {
            restrict: 'E',
            transclude: true,
            replace: true,
            scope: true,
            template: function(element, attrs) {
                var template = '';
                template += '<div class="card"><a  class="card-container"';
                if (attrs.allowclick != "false") {
                    template += ' ng-href="{{getLinkUrl()}}"';
                }
                template += '><svg holder class="logo holderjs" style="background-image:url({{accessors.LogoUrl(item)}})" viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="transparent" stroke-width="10" stroke-linecap="round" class="ng-hide" ng-show="showScore==true" stroke-location="outside"></circle></svg>';
                if (attrs.showTitle != "false") {
                    template += '<strong ng-bind-html="accessors.Title(item)|Truncate:35"></strong>';
                }
                if (attrs.showSubtitle != "false") {
                    template += '<small ng-show="accessors.SubTitle(item)!=\'null\'" ng-bind-html="accessors.SubTitle(item)"></small>';
                }
                template += '</a></div>';
                return template;
            },
            link: function(scope, elem, attrs, ctrls, transcludeFn) {
                if (attrs.item) {
                    scope.item = $parse(attrs.item)(scope);
                    scope.$watch(function() {
                        return $parse(attrs.item)(scope);
                    }, function(newVal) {
                        scope.item = newVal
                    });
                }
                if (attrs.accessors) {
                    scope.accessors = $parse(attrs.accessors)(scope);
                    scope.$watch(function() {
                        return $parse(attrs.accessors)(scope);
                    }, function(newVal) {
                        scope.accessors = newVal
                    });
                }
                scope.viewItem = viewItem;
                scope.getLinkUrl = getLinkUrl;

                function getLinkUrl() {
                    if (scope.item && scope.item.Id) {
                        var options = {};
                        if (attrs.id) {
                            options[attrs.id] = scope.item.Id;
                        } else {
                            options['Id'] = scope.item.Id;
                        }
                        return $state.href((scope.rNavTo || attrs.rNavTo), options);
                        // return $state.href((scope.rNavTo || attrs.rNavTo), { Id: scope.item.Id });
                    }
                }

                if (scope.accessors.Score) {
                    var percentScore = (2 * Math.PI * 50) / 5 * scope.accessors.Score(scope.item);
                    var percentColor = (percentScore < 90) ? 'red' : (percentScore >= 90 && percentScore < 180) ? 'orange' : (percentScore >= 180 && percentScore < 270) ? 'rgb(25, 195, 45)' : 'rgb(25, 195, 45);';
                    elem.find("circle")
                        .attr("stroke", percentColor)
                        .attr("stroke-dasharray", percentScore + ",10000");
                }

                function viewItem(item) {
                    if ($state.get(scope.rNavTo)) {
                        $state.go(scope.rNavTo, {
                            Id: item.Id
                        });
                    }
                }
            }
        }
    }
})(angular);