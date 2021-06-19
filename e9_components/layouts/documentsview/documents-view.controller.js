(function (angular) {
    var module = angular.module('framework.documents',[]);

    module.controller('DocumentsController', DocumentsController);

    DocumentsController.$inject = ['$scope', 'rData', '$state'];
    function DocumentsController($scope, rData, $state) {
        $scope.documents = rData;
        $scope.selectedDocument=rData[0];

        setTimeout(function() {
        	console.log("running now");
        	console.log($('.grid'));
        	$('.grid').masonry({
  				// options
  				itemSelector: '.grid-item',
  				columnWidth: 300
			});
        }, 1000);

    }

})(angular);