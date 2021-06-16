(function(angular){
	var module = angular.module('framework.directives.UI');

	module.directive('tagsinput', tagsinput);

	tagsinput.$inject=['$state', '$interval', '$parse','$http','$config'];
	function tagsinput($state, $interval, $parse, $http, $config) {
		return {
			restrict: 'AE',
			replace: true,
			scope: true,
			templateUrl:'/e9_components/directives/autocomplete-template.html',
			link: function (scope, elem, attrs, ctrls, transcludeFn) {
				scope.suggestions=[];
				scope.selectedTags = [];
				scope.searchText = '';
				scope.mode = attrs.displaymode;

				scope.selectedTags = $parse(attrs.model)(scope);

				attrs.$observe("displaymode", function (newVal) {
				    scope.mode = newVal;
				});
            	scope.$watch(function () { return $parse(attrs.model)(scope); }, function(newVal) { scope.selectedTags = newVal; });


            	var allTagsGetter = $parse(attrs.tagsdata);
            	var modelGetter = $parse(attrs.model);
            	
            	scope.data = allTagsGetter(scope).filter(function (item) {
					var found = 0;
					for(i=0;i<scope.selectedTags.length;i++) {
						if(item.Id == scope.selectedTags[i].Id) {
							found = 1;
						}
					}
					if(found==0)
						return item
				});

	            scope.selectedIndex=-1;

	            scope.removeTag=function(index){
	            	scope.selectedIndex=-1;
                	var removed = scope.selectedTags.splice(index,1);
                	scope.data.splice(index, 0, removed[0]);
                	scope.searchText = '';
                	modelGetter.assign(scope, scope.selectedTags);
                	
            	}

            	scope.search=function(){
	                scope.suggestions=scope.data.filter(function(item){
	                	return item.Name.toLowerCase().indexOf(scope.searchText.toLowerCase()) !=-1
	                });
	                scope.selectedIndex=-1;
	            }

            	scope.addToSelectedTags = function (index) {

            	    if ((!scope.selectedTags || scope.selectedTags.indexOf(scope.suggestions[index]) === -1) && scope.data.indexOf(scope.suggestions[index]) > -1) {

	                    scope.selectedTags.push(scope.suggestions[index]);

	                    modelGetter.assign(scope, scope.selectedTags);

	                    var index = scope.data.indexOf(scope.suggestions[index]);
            			scope.data.splice(index, 1);
            			scope.searchText='';
	                    scope.suggestions=scope.data;
	                    scope.selectedIndex=-1;
	                }
	                else {
	                	console.log("Already added");
	                	scope.selectedIndex=-1;
	                }
	            }

	            scope.checkKeyDown=function(event){
	                if(event.keyCode===40){
	                    event.preventDefault();
	                    if(scope.selectedIndex+1 !== scope.suggestions.length){
	                        scope.selectedIndex++;
	                    }
	                }
	                else if(event.keyCode===38){
	                    event.preventDefault();
	                    if(scope.selectedIndex-1 !== -1){
	                        scope.selectedIndex--;
	                    }
	                }
	                else if(event.keyCode===13){
	                	event.preventDefault();
	                    scope.addToSelectedTags(scope.selectedIndex);
	                }
	            }

	            scope.$watch('selectedIndex',function(val){
	                if(val!==-1) {
	                    //scope.searchText = scope.suggestions[scope.selectedIndex].Name;
	                }
	            });
			}
		}
	}
})(angular);