(function(angular){
	var module = angular.module('framework.directives.UI');

	module.directive('score', scoreDirective);

	scoreDirective.$inject=['$state', '$interval', '$parse'];
	
	function scoreDirective($state, $interval, $parse) {
		return {
			restrict: 'E',
			transclude: true,
			replace: true,
			scope: true,
			template: function(element, attrs) {
				var template='';
				template += '<div class="score"';
				if(attrs.size) {
					var scoreSize = parseInt(attrs.size);
					template += ' style="position:relative;width:'+ (scoreSize) +'px; height: ' + (scoreSize) + 'px; border-radius:'+ (scoreSize/2) + 'px;padding:5px;">';
				}
				else {
					template += ' style="width:100px;height:100px;border-radius:50px;">';
				}
				if(attrs.showScore) {
					template += '<div class="score-value" style="line-height:' + scoreSize + 'px">'+attrs.showScore+'</div>';
				}
				template += '<svg class="dial" viewBox="0 0 100 100">' +
								'<circle class="score-back-circle" cx="50" cy="50" r="45" fill="transparent" stroke-linecap="round"></circle>' +
								'<circle class="score-front-circle" cx="50" cy="50" r="45" fill="transparent" stroke-linecap="round"></circle>' +
							'</svg>';
				template += '</div>';
				return template;
			},
			link: function(scope, elem, attrs, ctrls, transcludeFn) {
				if(!attrs.value)
					return;
				
				var strokeWidth = (attrs.strokeWidth)? attrs.strokeWidth : 5;
				var percentScore = (2 * Math.PI*50)/100 * attrs.value;
				var percentColor = (percentScore < 90)? 'red': (percentScore >= 90 && percentScore <180)? 'orange' :(percentScore >= 180 && percentScore <270)? '#2AA2AB' : '#2AA2AB';

				elem.find("circle.score-back-circle")
					.attr("stroke", "#eee")
					.attr("stroke-width", strokeWidth);

				elem.find("circle.score-front-circle")
					.attr("stroke", percentColor)
					.attr("stroke-width", strokeWidth)
					.attr("stroke-dasharray", percentScore+",10000");
			}
		}
	}
})(angular);