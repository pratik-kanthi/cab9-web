(function(angular){
	var module = angular.module('framework.directives.UI');

	module.directive('numplate', cardDirective);
	cardDirective.$inject=['$state', '$interval', '$parse'];
	function cardDirective($state, $interval, $parse) {
		return {
			restrict: 'E',
			transclude: true,
			replace: true,
			scope: true,
			template: function(element, attrs) {
				var template='';
				template += '<div class="numplate"><a class="numplate-container"';
				if(attrs.allowClick!="false") {
				    template += ' ng-href="{{getLinkUrl()}}"';
				}
				template += '><svg holder class="logo holderjs" style="background-image:url(\'{{accessors.LogoUrl(item)}}\')" viewBox="0 0 150 40"><line x1="0" y1="0" x2="0" y2="0" fill="transparent" stroke-width="7" stroke-linecap="round" ng-show="showScore==true" stroke-location="outside"></line></svg>';
				if(attrs.showTitle!="false") {
					template += '<strong ng-bind-html="accessors.Title(item)"></strong>';
				}
				if(attrs.showSubtitle!="false") {
					template += '<small bind-html-compile="accessors.SubTitle(item)"></small>';
				}
				template += '</a></div>';
				return template;
			},
			link: function(scope, elem, attrs, ctrls, transcludeFn) {
				if(attrs.item) {
					var getter = $parse(attrs.item);
					scope.item = getter(scope);
				}
				if (attrs.accessors) {
                    var accessorsGetter = $parse(attrs.accessors);
                    scope.accessors = accessorsGetter(scope);
                }
				scope.viewItem = viewItem;
				scope.getLinkUrl = getLinkUrl;

				function getLinkUrl() {
				    return $state.href((scope.rNavTo || attrs.rNavTo), { Id: scope.item.Id });
				}
				
				if(scope.accessors.Score) {
					var percentScore = 150 * scope.accessors.Score(scope.item);
					var percentColor = (percentScore < 37.5)? 'red': (percentScore >= 37.5 && percentScore < 75)? 'orange' :(percentScore >= 75 && percentScore <112.5)? 'rgb(25, 195, 45)' : 'rgb(25, 195, 45)';
					elem.find("line")
						.attr("stroke", percentColor)
						.attr("x2", percentScore);
				}

				function viewItem(item) {
				    if ($state.get(scope.rNavTo)) {
				        $state.go(scope.rNavTo, { Id: item.Id });
				    }
        		}
			}
		}
	}
})(angular);